import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api.js";
import { getToken } from "../services/tokenStore.js";
import { getErrorMessage } from "../utils/httpError.js";
import { parseApiBody, pickPlan } from "../utils/parseApi.js";
import { useToast } from "../context/ToastContext.jsx";
import PageHero from "../components/premium/PageHero.jsx";
import AiBadge from "../components/AiBadge.jsx";
import StatusBadge from "../components/premium/StatusBadge.jsx";
import GlowProgress from "../components/premium/GlowProgress.jsx";
import {
  PLANNER_DIFFICULTIES,
  PLANNER_DURATIONS,
  PLANNER_CAREER_GOALS,
} from "../data/plannerTechList.js";
import AiLoadingSkeleton from "../components/AiLoadingSkeleton.jsx";
import { useTechnologyCatalog } from "../hooks/useTechnologyCatalog.js";
import { resolveTechnologyName } from "../data/technologyCatalog.js";
import { buildStaticPlan } from "../utils/staticPlanner.js";
import { normalizePlan } from "../utils/plannerNormalize.js";
import { safeAnalytics } from "../utils/advancedPlanner.js";
import { loadProgress, saveTaskProgress } from "../utils/plannerProgressStore.js";

export default function Planner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { technologies, geminiEnabled: catalogGemini, loading: catalogLoading } =
    useTechnologyCatalog({ coreOnly: true });
  const [planners, setPlanners] = useState([]);
  const [tech, setTech] = useState(() =>
    resolveTechnologyName(searchParams.get("tech") || searchParams.get("technology"))
  );
  const [difficulty, setDifficulty] = useState("medium");
  const [careerGoal, setCareerGoal] = useState(PLANNER_CAREER_GOALS[0]);
  const [durationId, setDurationId] = useState("8");
  const [tab, setTab] = useState("weekly");
  const [openWeek, setOpenWeek] = useState("w1");
  const [period, setPeriod] = useState("weekly");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [plan, setPlan] = useState(() =>
    normalizePlan(buildStaticPlan("React", "medium", PLANNER_CAREER_GOALS[0], 8), {
      technology: "React",
      difficulty: "medium",
      careerGoal: PLANNER_CAREER_GOALS[0],
      durationWeeks: 8,
    })
  );
  const [analytics, setAnalytics] = useState(() => safeAnalytics(plan, loadProgress("React")));
  const [geminiGenerated, setGeminiGenerated] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const fetchGen = useRef(0);
  const lastGoodPlan = useRef(null);
  const generateAttempts = useRef(0);
  const lastGenerateKey = useRef("");
  const toast = useToast();

  const durationWeeks = useMemo(
    () => PLANNER_DURATIONS.find((d) => d.id === durationId)?.weeks ?? 8,
    [durationId]
  );

  const planMeta = useMemo(
    () => ({ technology: tech, difficulty, careerGoal, durationWeeks }),
    [tech, difficulty, careerGoal, durationWeeks]
  );

  const syncAnalytics = useCallback(
    (nextPlan, progress = loadProgress(tech)) => {
      setAnalytics(safeAnalytics(nextPlan, progress));
    },
    [tech]
  );

  const loadSavedPlanners = useCallback(async () => {
    if (!getToken()) return;
    try {
      const parsed = parseApiBody((await api.get("/planner")).data);
      setPlanners(parsed.planners || []);
      setGeminiEnabled(Boolean(parsed.geminiEnabled));
    } catch {
      /* guest — saved plans require login */
    }
  }, []);

  const applyStaticPlan = useCallback(() => {
    const progress = loadProgress(tech);
    const staticP = normalizePlan(
      buildStaticPlan(tech, difficulty, careerGoal, durationWeeks),
      planMeta,
      progress
    );
    setPlan(staticP);
    lastGoodPlan.current = staticP;
    syncAnalytics(staticP, progress);
    if (staticP.weekly?.[0]?.id) setOpenWeek(staticP.weekly[0].id);
    setLoading(false);
  }, [tech, planMeta, difficulty, careerGoal, durationWeeks, syncAnalytics]);

  const generatePlan = useCallback(async () => {
    const gen = ++fetchGen.current;
    applyStaticPlan();
    setEnhancing(true);
    setError("");
    try {
      const { data } = await api.post("/planner/generate", {
        technology: tech,
        difficulty,
        careerGoal,
        duration: durationWeeks,
        durationWeeks,
        enhanceWithAi: import.meta.env.VITE_GEMINI_ENHANCE === "true",
      });
      if (gen !== fetchGen.current) return;
      const parsed = parseApiBody(data);
      const progress = loadProgress(tech);
      const applied = normalizePlan(pickPlan(parsed) || {}, planMeta, progress);
      if (!applied?.weekly?.length) {
        setError("Planner empty — using local roadmap.");
        toast.info("Using local roadmap");
      } else if (parsed.fallback && parsed.message) {
        setError(parsed.message);
        toast.info(parsed.message);
      } else {
        setError("");
        toast.success(`${tech} roadmap ready`);
      }
      setPlan(applied);
      lastGoodPlan.current = applied;
      syncAnalytics(applied, progress);
      if (parsed.analytics) setAnalytics(parsed.analytics);
      setGeminiGenerated(Boolean(parsed.geminiGenerated));
      setGeminiEnabled(Boolean(parsed.geminiEnabled ?? parsed.geminiGenerated));
      if (applied.weekly?.[0]?.id) setOpenWeek(applied.weekly[0].id);
    } catch (err) {
      if (gen !== fetchGen.current) return;
      const msg = getErrorMessage(err, "Could not generate planner");
      if (lastGoodPlan.current?.weekly?.length) {
        setPlan(lastGoodPlan.current);
        toast.info("Using last generated plan — tap Regenerate to retry");
      }
      setError(msg);
      toast.error(msg);
    } finally {
      if (gen === fetchGen.current) {
        setEnhancing(false);
        setLoading(false);
      }
    }
  }, [tech, difficulty, careerGoal, durationWeeks, planMeta, applyStaticPlan, syncAnalytics, toast]);

  const fetchAnalytics = useCallback(async () => {
    const progress = loadProgress(tech);
    syncAnalytics(plan, progress);
    try {
      const { data } = await api.get("/planner/analytics", {
        params: {
          technology: tech,
          difficulty,
          careerGoal,
          durationWeeks,
        },
      });
      const parsed = parseApiBody(data);
      if (parsed.analytics) setAnalytics(parsed.analytics);
    } catch {
      /* local analytics already set */
    }
  }, [tech, difficulty, careerGoal, durationWeeks, plan, syncAnalytics]);

  useEffect(() => {
    if (tab === "dashboard") fetchAnalytics();
  }, [tab, fetchAnalytics]);

  const handleTaskToggle = useCallback(
    (taskId, completed) => {
      const progress = saveTaskProgress(tech, taskId, completed, { planId: plan.planId });
      setPlan((prev) => {
        const next = normalizePlan(
          {
            ...prev,
            weekly: (prev.weekly || []).map((w) => ({
              ...w,
              days: (w.days || []).map((d) => ({
                ...d,
                tasks: (d.tasks || []).map((t) =>
                  t.id === taskId ? { ...t, completed } : t
                ),
              })),
            })),
          },
          planMeta,
          progress
        );
        lastGoodPlan.current = next;
        syncAnalytics(next, progress);
        return next;
      });
      if (getToken()) {
        api
          .post("/planner/task/update", {
            taskId,
            completed,
            technology: tech,
            planSnapshot: lastGoodPlan.current,
            difficulty,
            careerGoal,
            durationWeeks,
          })
          .catch(() => {});
      }
    },
    [tech, plan.planId, planMeta, difficulty, careerGoal, durationWeeks, syncAnalytics]
  );

  useEffect(() => {
    loadSavedPlanners();
  }, [loadSavedPlanners]);

  useEffect(() => {
    const t = searchParams.get("tech") || searchParams.get("technology");
    if (t) setTech(resolveTechnologyName(t));
  }, [searchParams]);

  useEffect(() => {
    if (catalogGemini) setGeminiEnabled(true);
  }, [catalogGemini]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tech", tech);
        return next;
      },
      { replace: true }
    );
  }, [tech, setSearchParams]);

  useEffect(() => {
    const key = `${tech}|${difficulty}|${careerGoal}|${durationWeeks}`;
    if (lastGenerateKey.current !== key) {
      lastGenerateKey.current = key;
      generateAttempts.current = 0;
    }
    applyStaticPlan();
    if (generateAttempts.current >= 2) {
      if (lastGoodPlan.current?.weekly?.length) setPlan(lastGoodPlan.current);
      return undefined;
    }
    const timer = setTimeout(() => {
      generateAttempts.current += 1;
      generatePlan();
    }, 400);
    return () => clearTimeout(timer);
  }, [tech, difficulty, careerGoal, durationWeeks, generatePlan, applyStaticPlan]);

  async function saveWeekToMongo(week) {
    setSaving(true);
    setError("");
    try {
      if (!getToken()) {
        toast.error("Sign in to save plans");
        return;
      }
      const parsed = parseApiBody(
        (
          await api.post("/planner", {
            period: "weekly",
            label: `${tech} — ${week.title}`,
            focus: tech,
            tasks: week.topics.map((title) => ({ title, completed: false })),
            fromGeneratedPlan: true,
            technology: tech,
            difficulty,
            careerGoal,
            durationWeeks,
            aiPlan: plan,
          })
        ).data
      );
      setPlanners(parsed.planners || []);
      toast.success("Week saved");
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save plan");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function saveFullPlan() {
    setSaving(true);
    setError("");
    try {
      const tasks = [
        ...(plan.weekly || []).flatMap((w) => (w.topics || []).map((t) => ({ title: t }))),
        ...(plan.dailyTargets || []).map((title) => ({ title })),
        ...(plan.dsaPlan || []).map((title) => ({ title })),
        ...(plan.interviewPath || []).map((title) => ({ title })),
      ];
      const { data } = await api.post("/planner", {
        period: "weekly",
        label: `${tech} — Gemini ${careerGoal}`,
        focus: tech,
        tasks,
        useAi: true,
        fromGeneratedPlan: true,
        technology: tech,
        difficulty,
        careerGoal,
        durationWeeks,
        aiPlan: plan,
      });
      setPlanners(data.planners);
    } catch (err) {
      setError(getErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(plannerId, taskId) {
    const { data } = await api.patch(`/planner/${plannerId}/tasks/${taskId}/toggle`);
    setPlanners(data.planners);
  }

  const progress = analytics?.weeklyCompletionPct ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <PageHero
        emoji="📅"
        title="Smart Learning Planner"
        subtitle="Gemini builds a unique roadmap per technology, goal, and timeline — powered by Google Gemini AI."
      >
        <div className="flex flex-wrap items-center gap-2">
          <AiBadge />
          {geminiGenerated && <AiBadge variant="dynamic" />}
        </div>
      </PageHero>

      <div className="glass-card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs text-slate-500">Technology</label>
          <select className="input-field mt-1 w-full" value={tech} onChange={(e) => setTech(e.target.value)}>
            {(technologies.length ? technologies : [tech]).map((name) => (
              <option key={name} value={name}>
                {name}
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
            {PLANNER_DIFFICULTIES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Career goal</label>
          <select
            className="input-field mt-1 w-full"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
          >
            {PLANNER_CAREER_GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Duration</label>
          <select
            className="input-field mt-1 w-full"
            value={durationId}
            onChange={(e) => setDurationId(e.target.value)}
          >
            {PLANNER_DURATIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-slate-400">Current track</p>
          <p className="font-display text-xl font-bold">{tech}</p>
          <p className="text-xs text-slate-500">
            {careerGoal} · {difficulty} · {durationWeeks} weeks
          </p>
          {plan.summary && <p className="mt-2 max-w-xl text-sm text-slate-400">{plan.summary}</p>}
        </div>
        <GlowProgress value={loading ? 0 : progress} label="Roadmap progress" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-glow text-sm" disabled={loading} onClick={generatePlan}>
            {loading ? "Gemini generating…" : "Regenerate plan"}
          </button>
          <button type="button" className="btn-ghost text-sm" disabled={saving || loading} onClick={saveFullPlan}>
            Save to MongoDB
          </button>
          <Link to={`/interview?technology=${encodeURIComponent(tech)}`} className="btn-ghost text-sm">
            Mock interview
          </Link>
        </div>
      </div>

      {enhancing && (
        <p className="text-xs text-slate-500">Optional AI enhancement in progress…</p>
      )}

      {error && !loading && <p className="text-sm text-amber-300">{error}</p>}

      <div className="flex gap-2">
        {["dashboard", "weekly", "monthly", "saved"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm capitalize ${
              tab === t ? "bg-electric-500/20 text-electric-300" : "bg-white/5 text-slate-400"
            }`}
          >
            {t === "saved" ? "My saved plans" : t === "dashboard" ? "📈 Dashboard" : `${t} planner`}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Weekly completion", value: analytics?.weeklyCompletionPct ?? 0, emoji: "📈" },
                { label: "Technology mastery", value: analytics?.technologyMastery ?? 0, emoji: "🏆" },
                { label: "Interview readiness", value: analytics?.interviewReadiness ?? 0, emoji: "🎯" },
                { label: "Productivity", value: analytics?.productivityScore ?? 0, emoji: "⚡" },
              ].map((card) => (
                <div key={card.label} className="premium-card rounded-2xl border border-electric-500/20 p-4">
                  <p className="text-xs text-slate-500">
                    {card.emoji} {card.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold text-electric-300">{card.value}%</p>
                  <GlowProgress value={card.value} className="mt-3" />
                </div>
              ))}
            </motion.div>
            <motion.div className="glass-card grid gap-4 p-5 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">⚡ Learning streak</h3>
                <p className="mt-2 text-3xl font-bold text-amber-300">{analytics?.learningStreak ?? 0} days</p>
              </div>
              <motion.div>
                <h3 className="font-semibold">🧠 AI recommendations</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-400">
                  {(analytics?.aiRecommendations || plan.aiTips || []).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
            {(analytics?.pendingTasks?.length > 0) && (
              <motion.div className="glass-card p-5">
                <h3 className="font-semibold">📋 Pending tasks</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  {analytics.pendingTasks.map((p) => (
                    <li key={`${p.week}-${p.task}`} className="rounded-lg border border-white/5 px-3 py-2">
                      <span className="text-slate-500">{p.day}</span> · {p.task}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
            {(analytics?.heatmap?.length > 0) && (
              <motion.div className="glass-card p-5">
                <h3 className="font-semibold">📈 Completion heatmap</h3>
                <motion.div className="mt-4 flex flex-wrap gap-2">
                  {analytics.heatmap.map((h) => (
                    <div
                      key={h.week}
                      className="rounded-lg px-3 py-2 text-xs"
                      style={{
                        background: `rgba(56, 189, 248, ${Math.max(0.15, (h.value || 0) / 100)})`,
                      }}
                      title={h.week}
                    >
                      {h.value}%
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === "weekly" && (
          <motion.div key={`weekly-${tech}-${plan.planId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {(plan.weekly || []).length === 0 && (
              <p className="text-slate-500">No weekly plan yet. Click Regenerate plan.</p>
            )}
            {(plan.weekly || []).map((week) => (
              <motion.div key={week.id} className="premium-card rounded-2xl border border-white/10 bg-navy-950/80">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  onClick={() => setOpenWeek(openWeek === week.id ? "" : week.id)}
                >
                  <div>
                    <p className="font-semibold">📅 {week.title}</p>
                    <p className="mt-1 text-sm text-slate-400">🎯 Goal: {week.goal}</p>
                  </div>
                  <StatusBadge status={week.status} />
                </button>
                {openWeek === week.id && (
                  <motion.div className="border-t border-white/5 px-5 pb-5">
                    {week.learningObjective && (
                      <p className="mt-3 text-sm text-electric-200/80">🎯 {week.learningObjective}</p>
                    )}
                    {(week.days || []).length > 0 ? (
                      <div className="mt-4 space-y-4">
                        {week.days.map((day) => (
                          <div key={day.key} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                            <p className="font-medium">
                              {day.emoji} {day.label}
                              <span className="ml-2 text-xs text-slate-500">— {day.theme}</span>
                            </p>
                            <ul className="mt-2 space-y-2">
                              {(day.tasks || []).map((task) => (
                                <li key={task.id} className="flex items-start gap-3 text-sm">
                                  <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={Boolean(task.completed)}
                                    onChange={() => handleTaskToggle(task.id, !task.completed)}
                                  />
                                  <span className={task.completed ? "line-through text-slate-500" : "text-slate-300"}>
                                    {task.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {(week.topics || []).map((topic) => (
                          <li key={topic} className="text-sm text-slate-300">
                            • {topic}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(week.codingPractice?.length > 0 || week.miniProjects?.length > 0) && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {week.codingPractice?.length > 0 && (
                          <div className="rounded-lg bg-white/5 p-3 text-sm">
                            <p className="font-medium text-slate-300">💻 Coding</p>
                            <ul className="mt-1 text-slate-400">
                              {week.codingPractice.map((c) => (
                                <li key={c}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {week.miniProjects?.length > 0 && (
                          <div className="rounded-lg bg-white/5 p-3 text-sm">
                            <p className="font-medium text-slate-300">🚀 Projects</p>
                            <ul className="mt-1 text-slate-400">
                              {week.miniProjects.map((c) => (
                                <li key={c}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={saving}
                      className="btn-ghost mt-4 text-sm"
                      onClick={() => saveWeekToMongo(week)}
                    >
                      Save week to my planner
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}

            <div className="glass-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold">Daily targets</h3>
                {geminiGenerated && <AiBadge variant="generated" />}
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                {(plan.dailyTargets || []).map((d) => (
                  <li key={d}>⚡ {d}</li>
                ))}
              </ul>
            </div>

            {(plan.revisionSchedule?.length > 0 || plan.dsaPlan?.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {plan.revisionSchedule?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="font-semibold">Revision schedule</h3>
                    <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
                      {plan.revisionSchedule.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {plan.dsaPlan?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="font-semibold">DSA plan</h3>
                    <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
                      {plan.dsaPlan.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {tab === "monthly" && (
          <motion.div key={`monthly-${tech}-${plan.planId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {(plan.monthly || []).map((month) => (
              <motion.div key={month.id} className="glass-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">🗓 {month.title}</p>
                    {month.phase && <p className="mt-1 text-xs text-electric-300">{month.phase}</p>}
                    <p className="mt-1 text-sm text-slate-400">{month.focus}</p>
                    {month.interviewReadiness != null && (
                      <p className="mt-2 text-sm text-amber-200/90">
                        🎯 Interview readiness: {month.interviewReadiness}%
                      </p>
                    )}
                  </div>
                  <StatusBadge status={month.status} />
                </div>
                <ul className="mt-4 space-y-2">
                  {(month.milestones || []).map((m) => (
                    <li key={m} className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm">
                      {m}
                    </li>
                  ))}
                </ul>
                {(month.githubGoals?.length > 0 || month.careerGuidance?.length > 0) && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-400">
                    {month.githubGoals?.length > 0 && (
                      <div>
                        <p className="font-medium text-slate-300">GitHub goals</p>
                        <ul className="mt-1 list-inside list-disc">
                          {month.githubGoals.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {month.careerGuidance?.length > 0 && (
                      <div>
                        <p className="font-medium text-slate-300">🧠 Career guidance</p>
                        <ul className="mt-1 list-inside list-disc">
                          {month.careerGuidance.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            <div className="glass-card p-5">
              <h3 className="font-semibold">🛠 Recommended projects</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
                {(plan.projects || []).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <h3 className="mt-4 font-semibold">🎯 Interview prep</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
                {(plan.interviewPath || []).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {tab === "saved" && (
          <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="font-semibold">Create custom plan (MongoDB)</h3>
              <form
                className="mt-4 grid gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  try {
                    const topics = plan.weekly?.[0]?.topics || ["Study session"];
                    const { data } = await api.post("/planner", {
                      period,
                      label: label || `${tech} custom`,
                      focus: tech,
                      tasks: topics.map((title) => ({ title })),
                      fromGeneratedPlan: true,
                      aiPlan: plan,
                    });
                    setPlanners(data.planners);
                    setLabel("");
                  } catch (err) {
                    setError(getErrorMessage(err, "Failed to create planner"));
                  }
                }}
              >
                <select className="input-field max-w-xs" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <input
                  className="input-field"
                  placeholder="Plan label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
                <button type="submit" className="btn-glow max-w-xs">
                  Save plan
                </button>
              </form>
            </div>
            {planners.map((p) => (
              <motion.div key={p._id} className="glass-card p-6">
                <div className="flex justify-between">
                  <h2 className="font-semibold capitalize">
                    {p.period}: {p.label}
                    {p.aiGenerated ? " · Gemini" : ""}
                  </h2>
                  <span>{p.progress}%</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.tasks.map((t) => (
                    <li key={t._id} className="flex items-center gap-3">
                      <input type="checkbox" checked={t.completed} onChange={() => toggle(p._id, t._id)} />
                      <span className={t.completed ? "line-through text-slate-500" : ""}>{t.title}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
            {!planners.length && (
              <p className="text-slate-500">No saved plans yet — save from the weekly tab.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
