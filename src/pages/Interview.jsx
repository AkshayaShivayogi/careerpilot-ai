import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import api, { safeApi } from "../services/api.js";
import { buildLocalInterviewSession } from "../data/interviewLocalBank.js";
import {
  cacheInterviewSession,
  loadCachedInterviewSession,
  clearCachedInterviewSession,
} from "../utils/interviewSessionCache.js";
import { applyLocalSubmit } from "../utils/clientInterviewScoring.js";
import {
  safeInterviewState,
  safeQuestionRender,
  safeSessionRestore,
} from "../utils/interviewSafe.js";
import { getToken } from "../services/tokenStore.js";
import { getErrorMessage } from "../utils/httpError.js";
import { parseApiBody, pickSession } from "../utils/parseApi.js";
import { useToast } from "../context/ToastContext.jsx";
import AiBadge from "../components/AiBadge.jsx";
import AiTypingText from "../components/AiTypingText.jsx";
import AiLoadingSkeleton from "../components/AiLoadingSkeleton.jsx";
import Loader, { ButtonLoading } from "../components/Loader.jsx";
import { useTechnologyCatalog } from "../hooks/useTechnologyCatalog.js";
import { resolveTechnologyName } from "../data/technologyCatalog.js";

function isLocalSession(s) {
  return Boolean(s?.localFallback || String(s?.id || s?._id || "").startsWith("local-"));
}

function normalizeSession(raw) {
  if (!raw) return null;
  const total = raw.questions?.length || raw.totalQuestions || 0;
  const answered = raw.answers?.length ?? raw.answeredCount ?? 0;
  const idx =
    raw.status === "completed"
      ? -1
      : typeof raw.currentQuestionIndex === "number" && raw.currentQuestionIndex >= 0
        ? raw.currentQuestionIndex
        : answered < total
          ? answered
          : -1;
  return {
    ...raw,
    id: raw.id || raw._id,
    answeredCount: answered,
    totalQuestions: total,
    currentQuestionIndex: idx,
  };
}

const INTERVIEW_STYLES = [
  { id: "beginner", label: "Beginner" },
  { id: "medium", label: "Medium" },
  { id: "advanced", label: "Advanced" },
  { id: "FAANG", label: "FAANG-style" },
  { id: "behavioral", label: "Behavioral" },
  { id: "system design", label: "System design" },
  { id: "coding", label: "Coding" },
];

function ScoreGauge({ score, label }) {
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#38bdf8" : "#f87171";
  return (
    <div className="glass-card flex flex-col items-center p-5 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex h-24 w-24 items-center justify-center rounded-full border-4 sm:h-28 sm:w-28"
        style={{ borderColor: color, boxShadow: `0 0 20px ${color}44` }}
      >
        <span className="font-display text-3xl font-bold" style={{ color }}>
          {score}%
        </span>
      </motion.div>
      <p className="mt-2 text-sm text-slate-400">{label}</p>
    </div>
  );
}

export default function Interview() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("practice");
  const { technologies, geminiEnabled: catalogGemini, loading: catalogLoading } =
    useTechnologyCatalog({ coreOnly: true });
  const [technology, setTechnology] = useState(
    () => resolveTechnologyName(searchParams.get("technology") || searchParams.get("tech"))
  );
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [selected, setSelected] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [questionCounts, setQuestionCounts] = useState({});
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const geminiActive = geminiEnabled || catalogGemini;
  const [styles, setStyles] = useState(["medium", "coding", "behavioral"]);
  const [analytics, setAnalytics] = useState(null);
  const [resumeOffer, setResumeOffer] = useState(null);
  const timerRef = useRef(null);
  const submittingRef = useRef(false);
  const toast = useToast();

  const loadHistory = useCallback(async () => {
    if (!getToken()) return;
    try {
      const parsed = parseApiBody((await api.get("/interview/history")).data);
      setHistory(parsed.history || parsed.sessions || []);
      setScoreHistory(parsed.scoreHistory || []);
    } catch {
      /* guest mode */
    }
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("technology") || searchParams.get("tech");
    if (fromUrl) setTechnology(resolveTechnologyName(fromUrl));
  }, [searchParams]);

  useEffect(() => {
    if (catalogGemini) setGeminiEnabled(true);
  }, [catalogGemini]);

  useEffect(() => {
    const cached = safeSessionRestore(loadCachedInterviewSession());
    if (cached?.questions?.length && cached.status === "active") {
      setResumeOffer(cached);
    }
    safeApi
      .get("/interview/technologies", {}, { fallback: { questionCounts: {}, geminiEnabled: false } })
      .then((result) => {
        const parsed = result.data?.questionCounts != null ? result.data : parseApiBody({ success: true, ...result.data });
        setQuestionCounts(parsed.questionCounts || {});
        setGeminiEnabled(Boolean(parsed.geminiEnabled));
      })
      .catch(() => {});
    loadHistory().catch(() => {});
  }, [loadHistory]);

  useEffect(() => {
    if (session?.status === "active") {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [session?.status, session?.id]);

  const interviewState = useMemo(() => safeInterviewState(session), [session]);
  const answeredCount = interviewState.answeredCount;
  const totalQ = interviewState.totalQuestions;
  const currentQuestionIndex = interviewState.currentQuestionIndex;

  const current = useMemo(() => safeQuestionRender(session), [session]);

  const saveSessionProgress = useCallback(
    async (nextSession) => {
      if (!nextSession) return;
      cacheInterviewSession(nextSession);
      if (isLocalSession(nextSession)) return;
      try {
        await safeApi.post(
          "/interview/save",
          {
            sessionId: nextSession.id || nextSession._id,
            durationSec: seconds,
            currentQuestionIndex: nextSession.currentQuestionIndex,
          },
          {},
          { fallback: () => ({ saved: true }) }
        );
      } catch {
        /* local cache is backup */
      }
    },
    [seconds]
  );

  const loadAnalytics = useCallback(async () => {
    try {
      const result = await safeApi.get(
        "/interview/analytics",
        {},
        {
          fallback: {
            analytics: {
              accuracy: interviewState.score,
              technologyPerformance: [],
              weakTopics: session?.weakTopics || [],
              recommendations: ["Practice daily", "Review weak topics"],
            },
          },
        }
      );
      const parsed = result.data?.analytics != null ? result.data : parseApiBody({ success: true, ...result.data });
      setAnalytics(parsed.analytics);
    } catch {
      setAnalytics({
        accuracy: interviewState.score,
        technologyPerformance: [],
        weakTopics: session?.weakTopics || [],
        recommendations: ["🧠 Complete more sessions for detailed analytics"],
      });
    }
  }, [interviewState.score, session?.weakTopics]);

  useEffect(() => {
    if (tab === "analytics") loadAnalytics();
  }, [tab, loadAnalytics]);

  const startInterview = useCallback(async () => {
    setError("");
    setFeedback(null);
    setSelected("");
    setTextAnswer("");
    setSeconds(0);
    setLoading(true);
    const localPack = () => buildLocalInterviewSession(technology, difficulty, questionCount);
    try {
      const result = await safeApi.post(
        "/interview/generate",
        { technology, difficulty, count: questionCount, styles, enhanceWithAi: false },
        {},
        { fallback: localPack }
      );
      const parsed = result.data?.session ? result.data : parseApiBody({ success: true, ...(result.data || {}) });
      let nextSession = normalizeSession(pickSession(parsed));
      if (!nextSession?.questions?.length) {
        const local = localPack();
        nextSession = normalizeSession(local.session);
      }
      setSession(nextSession);
      cacheInterviewSession(nextSession);
      if (parsed.geminiGenerated) setGeminiEnabled(true);
      setTab("practice");
      if (result.usedFallback || nextSession?.localFallback) {
        toast.info("Using offline question bank");
      } else {
        toast.success("Interview session started");
      }
    } catch {
      const local = localPack();
      const next = normalizeSession(local.session);
      setSession(next);
      cacheInterviewSession(next);
      setTab("practice");
      toast.info("Using offline question bank");
    } finally {
      setLoading(false);
    }
  }, [technology, difficulty, questionCount, styles, toast]);

  const submitCurrent = useCallback(async () => {
    if (!session || !current || feedback || loading || submittingRef.current) return;

    const answer =
      current.type === "mcq" || current.type === "output" || current.type === "debugging"
        ? selected
        : textAnswer;
    if (!String(answer ?? "").trim()) {
      setError("Select or type an answer first");
      return;
    }

    setError("");
    setLoading(true);
    submittingRef.current = true;

    const finishSubmit = (nextSession, resultPayload, alreadyAnswered = false) => {
      const normalized = normalizeSession(nextSession);
      setSession(normalized);
      saveSessionProgress(normalized);
      if (alreadyAnswered) {
        setFeedback(null);
        setSelected("");
        setTextAnswer("");
        setError("");
        if (nextSession?.status !== "completed") toast.info("Already answered — continuing");
        return;
      }
      setFeedback(resultPayload);
      if (resultPayload?.completed || nextSession?.status === "completed") {
        setFeedback(null);
        clearCachedInterviewSession();
        toast.success("Interview complete!");
        loadHistory().catch(() => {});
      } else {
        setSelected("");
        setTextAnswer("");
        setError("");
      }
    };

    try {
      if (isLocalSession(session)) {
        const out = applyLocalSubmit(session, current.id, answer);
        if (!out) throw new Error("Could not score answer locally");
        finishSubmit(normalizeSession(out.session), out.result, out.alreadyAnswered);
        return;
      }

      const result = await safeApi.post(
        "/interview/submit",
        {
          sessionId: session.id || session._id,
          questionId: current.id,
          answer,
          selectedOption: selected,
          durationSec: seconds,
        },
        {},
        {
          fallback: () => {
            const out = applyLocalSubmit(session, current.id, answer);
            if (!out) return null;
            return { session: out.session, result: out.result, alreadyAnswered: out.alreadyAnswered };
          },
        }
      );

      const parsed = result.data?.session
        ? result.data
        : parseApiBody({ success: true, ...(result.data || {}) });
      const nextSession = normalizeSession(pickSession(parsed));
      if (!nextSession) throw new Error("Invalid session response");
      finishSubmit(
        nextSession,
        parsed.result ?? null,
        parsed.alreadyAnswered || parsed.result?.alreadyAnswered
      );
    } catch (e) {
      const out = applyLocalSubmit(session, current.id, answer);
      if (out) {
        finishSubmit(normalizeSession(out.session), out.result, out.alreadyAnswered);
        toast.info("Scored locally — reconnect to sync history");
      } else {
        const msg = getErrorMessage(e, "Could not submit answer");
        setError(msg);
        toast.error(msg);
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }, [session, current, feedback, loading, selected, textAnswer, seconds, loadHistory, toast, saveSessionProgress]);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setSelected("");
    setTextAnswer("");
    setError("");
  }, []);

  async function openSession(id) {
    setLoading(true);
    setError("");
    try {
      const parsed = parseApiBody((await api.get(`/interview/${id}`)).data);
      setSession(normalizeSession(pickSession(parsed)));
      setFeedback(null);
      setTab("practice");
    } catch (e) {
      setError(getErrorMessage(e, "Could not load session"));
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(id) {
    if (!confirm("Delete this interview session?")) return;
    try {
      await api.delete(`/interview/${id}`);
      if ((session?.id || session?._id) === id) setSession(null);
      await loadHistory();
    } catch (e) {
      setError(getErrorMessage(e, "Delete failed"));
    }
  }

  const trendLine =
    scoreHistory.length > 0
      ? [...scoreHistory].reverse().map((s, i) => ({ label: `#${i + 1}`, score: s.score }))
      : [];

  const charts = session?.chartsData || {};
  const isMcqLike = current && ["mcq", "output", "debugging"].includes(current.type);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div
        className="glass-card relative overflow-hidden p-6 sm:p-8"
        style={{ boxShadow: "0 0 40px rgba(14, 165, 233, 0.1)" }}
      >
        <motion.div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-electric-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-electric-400">CareerPilot AI</p>
            {geminiActive && <AiBadge />}
            {session?.aiGenerated && <AiBadge variant="generated" />}
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">AI Interview Engine</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">
            Local-first interview prep — 100+ questions per technology, FAANG-style MCQ, coding, debugging, system
            design, and behavioral drills with instant scoring and session reports.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["practice", "analytics", "history"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-sm capitalize ${
                  tab === t ? "bg-electric-500/20 text-electric-300" : "text-slate-400 hover:bg-navy-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {catalogLoading && !session && <AiLoadingSkeleton rows={3} label="Loading technologies…" />}

      {resumeOffer && tab === "practice" && !session && (
        <motion.div className="glass-card border border-electric-500/30 p-5">
          <p className="font-semibold text-electric-300">⚡ Resume your last session?</p>
          <p className="mt-1 text-sm text-slate-400">
            {resumeOffer.technology} · {resumeOffer.answeredCount || 0}/{resumeOffer.totalQuestions || 0} answered
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-glow text-sm"
              onClick={() => {
                setSession(normalizeSession(resumeOffer));
                setResumeOffer(null);
                toast.success("Session restored");
              }}
            >
              Continue interview
            </button>
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => {
                clearCachedInterviewSession();
                setResumeOffer(null);
              }}
            >
              Start fresh
            </button>
          </div>
        </motion.div>
      )}

      {tab === "practice" && !session && !catalogLoading && (
        <motion.div className="glass-card p-6">
          <h2 className="font-semibold">Interview setup</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs text-slate-500">Technology</label>
              <select
                className="input-field mt-1 w-full"
                value={technology}
                onChange={(e) => setTechnology(e.target.value)}
              >
                {(technologies.length ? technologies : [technology]).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Difficulty</label>
              <select
                className="input-field mt-1 w-full"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Questions</label>
              <select
                className="input-field mt-1 w-full"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              >
                {[5, 10, 15, 20, 25].map((n) => (
                  <option key={n} value={n}>
                    {n} questions
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" className="btn-glow w-full" disabled={loading} onClick={startInterview} aria-busy={loading}>
                {loading ? <ButtonLoading>Generating interview…</ButtonLoading> : "Start interview"}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500">Question styles (mix)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERVIEW_STYLES.map((s) => (
                <label
                  key={s.id}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs ${
                    styles.includes(s.id)
                      ? "border-violet-500/50 bg-violet-500/15 text-violet-200"
                      : "border-white/10 text-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={styles.includes(s.id)}
                    onChange={() =>
                      setStyles((prev) =>
                        prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                      )
                    }
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          {questionCounts[technology] != null && (
            <p className="mt-2 text-xs text-slate-500">
              Question bank: {questionCounts[technology]}+ questions for {technology}
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </motion.div>
      )}

      {tab === "practice" && session?.status === "active" && !current && answeredCount < totalQ && (
        <motion.div className="glass-card p-6 text-center">
          <p className="text-slate-400">Loading next question…</p>
          <button
            type="button"
            className="btn-ghost mt-3 text-sm"
            onClick={async () => {
              try {
                const result = await safeApi.get(
                  "/interview/next",
                  { params: { sessionId: session.id || session._id } },
                  { fallback: () => ({ session }) }
                );
                const parsed = result.data?.session ? result.data : parseApiBody({ success: true, ...result.data });
                if (parsed.session) setSession(normalizeSession(parsed.session));
              } catch {
                setSession(normalizeSession(session));
              }
            }}
          >
            Refresh session
          </button>
        </motion.div>
      )}

      {tab === "practice" && session?.status === "active" && current && (
        <div className="space-y-4" key={`interview-q-${current.id}-${currentQuestionIndex}`}>
          <div className="glass-card p-4">
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>Progress</span>
              <span>
                {answeredCount}/{totalQ} answered
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-navy-800">
              <motion.div
                className="h-full rounded-full bg-electric-500"
                animate={{ width: `${totalQ ? (answeredCount / totalQ) * 100 : 0}%` }}
              />
            </div>
          </div>
          <motion.div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <motion.div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-electric-300">
                  {session.technology} · {session.difficulty}
                </p>
                {session.aiGenerated && <AiBadge variant="dynamic" />}
              </motion.div>
              <p className="text-xs text-slate-500">
                Question {answeredCount + 1} of {totalQ} · {seconds}s elapsed
              </p>
            </div>
            <p className="text-sm text-cyan-400">
              Score: {session.score ?? session.percentage ?? 0}% ({session.pointsEarned || 0}/
              {session.maxPoints || 0} pts)
            </p>
          </motion.div>

          <div className="glass-card relative p-6">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-navy-950/75 backdrop-blur-sm">
                <Loader size="md" label="AI is scoring your answer…" center />
              </div>
            )}
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-navy-800 px-2 py-1 text-slate-300">{current.type}</span>
              <span className="rounded bg-navy-800 px-2 py-1 text-slate-300">{current.topic}</span>
              {current.style && (
                <span className="rounded bg-violet-500/15 px-2 py-1 text-violet-200">{current.style}</span>
              )}
              <span className="rounded bg-electric-500/10 px-2 py-1 text-electric-300">
                {current.companyRelevance}
              </span>
              {current.aiGenerated && <AiBadge variant="generated" />}
            </div>
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{current.question}</p>
            {current.codeSnippet && (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-navy-950 p-4 text-sm text-slate-200">
                <code>{current.codeSnippet}</code>
              </pre>
            )}

            {isMcqLike && (
              <div className="mt-4 space-y-2">
                {current.options.map((opt) => {
                  const locked = !!feedback;
                  const isSelected = selected === opt;
                  const isCorrect = feedback && opt === feedback.correctAnswer;
                  const isWrong = feedback && isSelected && !feedback.isCorrect;
                  let cls = "border-white/10 hover:border-white/30";
                  if (isSelected && !feedback) cls = "border-electric-500 bg-electric-500/20";
                  if (isCorrect) cls = "border-emerald-500 bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.3)]";
                  if (isWrong) cls = "border-red-500 bg-red-500/20 shadow-[0_0_12px_rgba(248,113,113,0.3)]";
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={locked}
                      onClick={() => !locked && setSelected(opt)}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {!isMcqLike && (
              <textarea
                className="input-field mt-4 min-h-[120px] w-full"
                value={textAnswer}
                disabled={!!feedback}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type your answer…"
              />
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-ghost text-sm"
                disabled={loading}
                onClick={() => saveSessionProgress(session)}
              >
                💾 Save session
              </button>
              {!feedback ? (
                <button type="button" className="btn-glow" disabled={loading} onClick={submitCurrent} aria-busy={loading}>
                  {loading ? <ButtonLoading>Scoring answer…</ButtonLoading> : "Submit answer"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-glow"
                  onClick={() => {
                    if (answeredCount >= totalQ - 1 && session.answers?.length >= totalQ) {
                      setFeedback(null);
                    } else {
                      nextQuestion();
                    }
                  }}
                >
                  {session.answers?.length >= totalQ || answeredCount >= totalQ
                    ? "View report"
                    : "Next question"}
                </button>
              )}
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-xl p-4 text-sm ${
                    feedback.isCorrect ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{feedback.isCorrect ? "Correct" : "Needs work"}</p>
                    {feedback.geminiEvaluated && <AiBadge variant="dynamic" />}
                    {feedback.score != null && (
                      <span className="rounded bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                        AI score: {feedback.score}%
                      </span>
                    )}
                  </div>
                  {feedback.explanation && (
                    <AiTypingText text={feedback.explanation} className="mt-2 text-slate-200" />
                  )}
                  {(feedback.communicationRating != null || feedback.confidenceRating != null) && (
                    <motion.div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {feedback.communicationRating != null && (
                        <motion.div className="rounded-lg bg-navy-900/60 p-2 text-xs">
                          Communication: {feedback.communicationRating}%
                        </motion.div>
                      )}
                      {feedback.confidenceRating != null && (
                        <motion.div className="rounded-lg bg-navy-900/60 p-2 text-xs">
                          Confidence: {feedback.confidenceRating}%
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                  {feedback.strengths?.length > 0 && (
                    <p className="mt-2 text-emerald-200 text-xs">
                      Strengths: {feedback.strengths.join(" · ")}
                    </p>
                  )}
                  {feedback.weaknesses?.length > 0 && (
                    <p className="mt-1 text-red-200/90 text-xs">
                      Weaknesses: {feedback.weaknesses.join(" · ")}
                    </p>
                  )}
                  {feedback.idealAnswer && (
                    <p className="mt-2 text-slate-300 text-xs">
                      <span className="font-medium text-slate-200">Ideal answer:</span> {feedback.idealAnswer}
                    </p>
                  )}
                  {!feedback.isCorrect && feedback.correctAnswer && (
                    <p className="mt-2 text-slate-300">Expected: {feedback.correctAnswer}</p>
                  )}
                  {feedback.speechAnalysisNote && (
                    <p className="mt-2 text-xs text-slate-500 italic">{feedback.speechAnalysisNote}</p>
                  )}
                  {feedback.whyItMatters && (
                    <p className="mt-2 text-slate-300">
                      <span className="font-medium text-slate-200">Why it matters:</span>{" "}
                      {feedback.whyItMatters}
                    </p>
                  )}
                  {feedback.realWorldExample && (
                    <p className="mt-2 text-slate-300">
                      <span className="font-medium text-slate-200">Real-world example:</span>{" "}
                      {feedback.realWorldExample}
                    </p>
                  )}
                  {feedback.commonMistake && (
                    <p className="mt-2 text-slate-300">
                      <span className="font-medium text-slate-200">Common mistake:</span>{" "}
                      {feedback.commonMistake}
                    </p>
                  )}
                  {(feedback.interviewTip || feedback.improvementTip) && (
                    <p className="mt-2 text-amber-200">
                      Tip: {feedback.interviewTip || feedback.improvementTip}
                    </p>
                  )}
                  {(feedback.timeComplexity || feedback.spaceComplexity) && (
                    <p className="mt-2 text-slate-400 text-xs">
                      Complexity: {feedback.timeComplexity || "—"} time ·{" "}
                      {feedback.spaceComplexity || "—"} space
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
        </div>
      )}

      {tab === "practice" && session?.status === "completed" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <motion.div className="glass-card p-6 text-center">
            <div className="mb-2 flex flex-wrap justify-center gap-2">
              {session.aiGenerated && <AiBadge />}
              <AiBadge variant="generated" />
            </div>
            <p className="text-sm text-emerald-400">Interview complete</p>
            <h2 className="font-display text-3xl font-bold">{session.percentage ?? session.score}%</h2>
            {session.reportSummary && (
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">{session.reportSummary}</p>
            )}
            {session.aiFeedback?.reportSummary && !session.reportSummary && (
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">{session.aiFeedback.reportSummary}</p>
            )}
            <p className="mt-1 text-slate-400">
              {session.readiness} · {session.correctCount}/{session.totalQuestions} correct
            </p>
            <button
              type="button"
              className="btn-ghost mt-4 text-sm"
              onClick={() => {
                setSession(null);
                setFeedback(null);
              }}
            >
              New interview
            </button>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ScoreGauge score={session.percentage ?? session.score} label="Accuracy" />
            <ScoreGauge score={session.skillConfidence ?? session.percentage} label="Confidence" />
            <div className="glass-card flex flex-col items-center justify-center p-5">
              <p className="text-xs text-slate-500">Readiness</p>
              <p className="mt-2 text-lg font-bold text-electric-400">{session.readiness}</p>
            </div>
          </div>

          {charts.topicPerformance?.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-card h-72 p-6">
                <h3 className="mb-2 font-semibold">Topic performance</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={charts.topicPerformance}>
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card h-72 p-6">
                <h3 className="mb-2 font-semibold">Skill radar</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <RadarChart data={charts.radar || []}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="topic" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                    <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {charts.difficultyBreakdown?.length > 0 && (
            <div className="glass-card h-64 p-6">
              <h3 className="mb-2 font-semibold">Difficulty breakdown</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={charts.difficultyBreakdown}>
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
                  <YAxis tick={{ fill: "#94a3b8" }} />
                  <Tooltip />
                  <Bar dataKey="correct" stackId="a" fill="#34d399" name="Correct" />
                  <Bar dataKey="missed" stackId="a" fill="#f87171" name="Missed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {trendLine.length > 1 && (
            <div className="glass-card h-56 p-6">
              <h3 className="mb-2 font-semibold">Score trend</h3>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={trendLine}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8" }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-emerald-400">Strengths</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {(session.strengths || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold text-red-400">Weaknesses</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {(session.weaknesses || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {session.aiTips?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold">AI interview tips</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {session.aiTips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {session.roadmapSuggestions?.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {session.roadmapSuggestions.map((rm) => (
                <div key={rm.title} className="glass-card p-5">
                  <h3 className="font-semibold text-electric-400">{rm.title}</h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                    {(rm.steps || []).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {tab === "analytics" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Accuracy", value: analytics?.accuracy ?? 0, emoji: "🎯" },
              { label: "Readiness", value: analytics?.interviewReadiness ?? analytics?.accuracy ?? 0, emoji: "🏆" },
              { label: "Sessions", value: analytics?.completedSessions ?? 0, emoji: "📈", suffix: "" },
              { label: "Solved", value: analytics?.solvedQuestionCount ?? 0, emoji: "💻", suffix: "" },
            ].map((card) => (
              <div key={card.label} className="premium-card rounded-2xl border border-electric-500/20 p-4">
                <p className="text-xs text-slate-500">
                  {card.emoji} {card.label}
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-electric-300">
                  {card.value}
                  {card.suffix === "" ? "" : "%"}
                </p>
              </div>
            ))}
          </div>
          {analytics?.technologyPerformance?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold">Technology performance</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                {analytics.technologyPerformance.map((t) => (
                  <li key={t.technology} className="flex justify-between rounded-lg border border-white/5 px-3 py-2">
                    <span>{t.technology}</span>
                    <span className="text-electric-300">{t.avgScore}% · {t.sessions} sessions</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analytics?.weakTopics?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-amber-300">Weak topics</h3>
              <p className="mt-2 text-sm text-slate-400">{analytics.weakTopics.join(" · ")}</p>
            </div>
          )}
          {analytics?.recommendations?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold">🧠 Recommendations</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-400">
                {analytics.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {tab === "history" && (
        <div className="glass-card p-6">
          <h2 className="font-semibold">Session history</h2>
          {history.length === 0 && <p className="mt-3 text-slate-500">No interviews yet.</p>}
          <div className="mt-4 space-y-3">
            {history.map((h) => (
              <motion.div
                key={h.id || h._id}
                layout
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-navy-900/40 p-4"
              >
                <div>
                  <p className="font-medium">{h.technology}</p>
                  <p className="text-xs text-slate-500">
                    {h.difficulty} · {h.percentage ?? h.score}% · {h.readiness || h.status}
                    {h.aiGenerated ? " · Gemini" : ""} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost text-sm" onClick={() => openSession(h.id || h._id)}>
                    Review
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm text-red-300"
                    onClick={() => deleteSession(h.id || h._id)}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
