import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import api, { safeApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/httpError.js";
import { buildLocalResumeAnalysis } from "../data/apiFallbacks.js";
import AiBadge from "../components/AiBadge.jsx";

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function ScoreRing({ score, label }) {
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#38bdf8" : "#f87171";
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-card flex flex-col items-center justify-center p-5 text-center"
    >
      <div
        className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 sm:h-32 sm:w-32"
        style={{ borderColor: color, boxShadow: `0 0 24px ${color}55` }}
      >
        <span className="font-display text-3xl font-bold sm:text-4xl" style={{ color }}>
          {score ?? 0}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-300">{label}</p>
    </motion.div>
  );
}

function AtsBar({ score }) {
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#38bdf8" : "#f87171";
  return (
    <div className="glass-card p-6">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-400">ATS compatibility</span>
        <span className="font-semibold" style={{ color }}>
          {score}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-navy-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, score || 0)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

function validateFile(f) {
  if (!f) return "No file selected";
  const name = f.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) return "Only PDF and DOCX files are supported";
  if (f.size > 5 * 1024 * 1024) return "File too large. Maximum size is 5MB";
  return null;
}

export default function Resume() {
  const { user } = useAuth();
  const [tab, setTab] = useState("analyze");
  const [roles, setRoles] = useState([]);
  const [targetRole, setTargetRole] = useState("software engineer");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [improvement, setImprovement] = useState(0);
  const [error, setError] = useState("");
  const [offlineNote, setOfflineNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadHistory = useCallback(async () => {
    const { data } = await api.get("/resume/history");
    setHistory(data.history || []);
    setScoreHistory(data.scoreHistory || []);
    setImprovement(data.improvementPercent || 0);
  }, []);

  useEffect(() => {
    const roleDefault = user?.targetRole || "software engineer";
    setTargetRole(roleDefault);
    api.get("/resume/roles").then((r) => setRoles(r.data.targetRoles || [])).catch(() => {});
    loadHistory().catch(() => {});
  }, [user?.targetRole, loadHistory]);

  function pickFile(f) {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setFile(f);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  function clearFile() {
    setFile(null);
    setError("");
  }

  async function analyze(e) {
    e?.preventDefault();
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError("");
    setOfflineNote("");
    setUploadProgress(10);

    const fd = new FormData();
    fd.append("resume", file);
    fd.append("targetRole", targetRole);

    const progressTimer = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + 8 : p));
    }, 200);

    try {
      const result = await safeApi.post(
        "/resume/analyze",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
        { fallback: () => buildLocalResumeAnalysis(targetRole, file.name) }
      );
      setUploadProgress(100);
      const payload = result.data?.analysis ?? result.data;
      if (payload && (payload.overallScore != null || payload.detectedSkills || payload.localFallback)) {
        setAnalysis(payload.analysis ?? payload);
        setFile(null);
        if (result.usedFallback) {
          setOfflineNote("Offline ATS analysis — reconnect for full AI scoring.");
        }
        loadHistory().catch(() => {});
        setTab("analyze");
      } else {
        setAnalysis(buildLocalResumeAnalysis(targetRole, file.name));
        setOfflineNote("Offline ATS analysis — reconnect for full AI scoring.");
        setFile(null);
        setTab("analyze");
      }
    } catch (err) {
      setAnalysis(buildLocalResumeAnalysis(targetRole, file.name));
      setOfflineNote("Offline ATS analysis — reconnect for full AI scoring.");
      setError("");
      setFile(null);
      setTab("analyze");
    } finally {
      clearInterval(progressTimer);
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  }

  async function openHistoryItem(id) {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/resume/${id}`);
      setAnalysis(data.analysis);
      setTab("analyze");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load analysis"));
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id) {
    if (!confirm("Delete this resume analysis?")) return;
    try {
      await api.delete(`/resume/${id}`);
      if (analysis?.id === id || analysis?._id === id) setAnalysis(null);
      await loadHistory();
    } catch (err) {
      setError(getErrorMessage(err, "Delete failed"));
    }
  }

  const sectionBar =
    analysis?.chartsData?.sectionBar ||
    (analysis?.sectionScores
      ? Object.entries(analysis.sectionScores).map(([name, value]) => ({ name, value }))
      : []);
  const radar = analysis?.skillRadar || [];
  const demand = analysis?.chartsData?.demandTrend || analysis?.marketDemand?.skills || [];
  const techRadar = analysis?.technologyRadar || analysis?.chartsData?.technologyRadar || [];
  const strengthDist = analysis?.chartsData?.strengthDistribution || [];
  const missingChart = analysis?.chartsData?.missingSkillsChart || [];
  const trendLine =
    scoreHistory.length > 0
      ? [...scoreHistory].reverse().map((s, i) => ({ label: `#${i + 1}`, score: s.score }))
      : [{ label: "Now", score: analysis?.overallScore || 0 }];

  const levelColor =
    analysis?.resumeLevel === "Industry Ready"
      ? "text-emerald-400 bg-emerald-500/15"
      : analysis?.resumeLevel === "Advanced"
        ? "text-cyan-400 bg-cyan-500/15"
        : analysis?.resumeLevel === "Intermediate"
          ? "text-electric-400 bg-electric-500/15"
          : "text-amber-400 bg-amber-500/15";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Hero */}
      <motion.div
        className="glass-card relative overflow-hidden p-6 sm:p-8"
        style={{ boxShadow: "0 0 40px rgba(14, 165, 233, 0.12)" }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-electric-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-electric-400">CareerPilot AI</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">AI Resume Analyzer</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400 sm:text-base">
            Analyze your resume using ATS scoring, AI skill detection, market trends, missing technologies,
            strengths, weaknesses, and career insights.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["analyze", "history"].map((t) => (
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

      {tab === "analyze" && (
        <motion.div className="glass-card p-6">
          <form onSubmit={analyze} className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <select
                className="input-field max-w-xs"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                {(roles.length ? roles : [targetRole]).map((r) => (
                  <option key={r} value={r.toLowerCase()}>
                    {r}
                  </option>
                ))}
              </select>
              {user?.github && <span className="self-center text-xs text-slate-500">Profile synced</span>}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
                dragOver
                  ? "border-electric-400 bg-electric-500/10 shadow-[0_0_24px_rgba(14,165,233,0.2)]"
                  : "border-slate-600 bg-navy-900/50"
              }`}
            >
              <p className="text-lg text-slate-200">Drag & drop your resume</p>
              <p className="mt-1 text-sm text-slate-500">PDF or DOCX · max 5MB</p>
              <label className="btn-glow mt-4 inline-block cursor-pointer">
                Choose file
                <input
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {file && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-electric-500/30 bg-electric-500/5 p-4">
                <div>
                  <p className="font-medium text-electric-300">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost text-sm" onClick={clearFile}>
                    Remove
                  </button>
                  <button type="submit" className="btn-glow text-sm" disabled={loading}>
                    {loading ? "Analyzing…" : "Analyze resume"}
                  </button>
                </div>
              </div>
            )}

            {loading && uploadProgress > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Processing resume…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-navy-800">
                  <motion.div
                    className="h-full rounded-full bg-electric-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {!file && (
              <button type="submit" className="btn-glow w-full sm:w-auto" disabled>
                Upload a file to analyze
              </button>
            )}

            {offlineNote && <p className="text-sm text-amber-300">{offlineNote}</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </motion.div>
      )}

      {tab === "history" && (
        <div className="glass-card p-6">
          {improvement !== 0 && (
            <p className="mb-4 text-sm text-emerald-400">
              Score change since first upload: {improvement > 0 ? "+" : ""}
              {improvement}%
            </p>
          )}
          {history.length === 0 && <p className="text-slate-500">No analyses yet. Upload your first resume.</p>}
          <div className="space-y-3">
            {history.map((h) => (
              <motion.div
                key={h.id || h._id}
                layout
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-navy-900/40 p-4"
              >
                <div>
                  <p className="font-medium">{h.resumeName || h.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {h.targetRole} · {h.overallScore}% · {h.resumeLevel || "—"} ·{" "}
                    {new Date(h.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost text-sm" onClick={() => openHistoryItem(h.id || h._id)}>
                    View report
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm text-red-300"
                    onClick={() => removeItem(h.id || h._id)}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {analysis && (
          <motion.div
            key={analysis.id || analysis._id || "current"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {analysis.localFallback && (
              <p className="text-sm text-amber-300/90">Local ATS analysis (API unavailable)</p>
            )}
            {(analysis.geminiGenerated || analysis.aiPowered) && (
              <div className="flex flex-wrap gap-2">
                <AiBadge variant="generated" />
                <AiBadge variant="dynamic" />
              </div>
            )}
            {analysis.resumeLevel && (
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-4 py-1 text-sm font-semibold ${levelColor}`}>
                  {analysis.resumeLevel}
                </span>
                <span className="text-sm text-slate-500">
                  Keyword density: {analysis.keywordDensity ?? analysis.keywordScore ?? 0}%
                </span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <ScoreRing score={analysis.overallScore} label="Overall" />
              <ScoreRing score={analysis.atsScore} label="ATS" />
              <ScoreRing score={analysis.skillScore ?? analysis.sectionScores?.technicalSkills} label="Skills" />
              <ScoreRing score={analysis.projectScore ?? analysis.sectionScores?.projects} label="Projects" />
              <ScoreRing score={analysis.experienceScore ?? analysis.sectionScores?.experience} label="Experience" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AtsBar score={analysis.atsScore} />
              <div className="glass-card grid grid-cols-3 gap-4 p-4 text-center">
                <div>
                  <p className="text-xs text-slate-500">Industry</p>
                  <p className="text-xl font-bold text-cyan-400">{analysis.industryMatch}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Role fit</p>
                  <p className="text-xl font-bold text-electric-400">{analysis.roleFit}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Demand</p>
                  <p className="text-xl font-bold text-indigo-400">{analysis.demandPercentage}%</p>
                </div>
              </div>
            </div>

            {analysis.extracted && (
              <div className="glass-card p-6">
                <h2 className="font-semibold">Extracted profile</h2>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  {analysis.extracted.name && <p>Name: {analysis.extracted.name}</p>}
                  {analysis.extracted.email && <p>Email: {analysis.extracted.email}</p>}
                  {analysis.extracted.github && <p>GitHub: {analysis.extracted.github}</p>}
                  {analysis.extracted.linkedin && <p>LinkedIn: {analysis.extracted.linkedin}</p>}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-card h-72 p-6">
                <h2 className="mb-2 font-semibold">Section scores</h2>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={sectionBar}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {sectionBar.map((_, i) => (
                        <Cell key={i} fill={i % 2 ? "#0ea5e9" : "#22d3ee"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card h-72 p-6">
                <h2 className="mb-2 font-semibold">Skill radar</h2>
                <ResponsiveContainer width="100%" height="90%">
                  <RadarChart data={radar}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                    <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {techRadar.length > 0 && (
              <div className="glass-card h-72 p-6">
                <h2 className="mb-2 font-semibold">Technology match by category</h2>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={techRadar}>
                    <XAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#6366f1" name="Match %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {strengthDist.length > 0 && (
              <div className="glass-card h-64 p-6">
                <h2 className="mb-2 font-semibold">Resume strength distribution</h2>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={strengthDist}>
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {demand.length > 0 && (
              <div className="glass-card h-64 p-6">
                <h2 className="mb-2 font-semibold">Market demand</h2>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={demand}>
                    <XAxis dataKey="skill" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip />
                    <Bar dataKey="demand" fill="#22d3ee" name="Demand %" />
                    <Bar dataKey="hiring" fill="#6366f1" name="Hiring %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {missingChart.length > 0 && (
              <div className="glass-card h-56 p-6">
                <h2 className="mb-2 font-semibold">Missing skills gap</h2>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={missingChart} layout="vertical">
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis type="category" dataKey="skill" width={90} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Bar dataKey="gap" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {trendLine.length > 1 && (
              <div className="glass-card h-56 p-6">
                <h2 className="mb-2 font-semibold">Score improvement over time</h2>
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
                <h3 className="font-semibold text-emerald-400">Detected skills</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(analysis.detectedSkills || analysis.extractedSkills || []).map((s) => (
                    <span key={s} className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold text-amber-400">Missing skills</h3>
                <div className="mt-3 space-y-2">
                  {(analysis.missingSkills || []).slice(0, 10).map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded bg-navy-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "30%" }}
                          className="h-2 rounded bg-amber-500/60"
                        />
                      </div>
                      <span className="text-xs text-slate-300">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-card p-6">
                <h3 className="font-semibold text-emerald-400">Strengths</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {(analysis.strengths || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold text-red-400">Weaknesses</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {(analysis.weaknesses || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {(analysis.grammarIssues?.length > 0 || analysis.improvementAreas?.length > 0) && (
              <div className="grid gap-6 lg:grid-cols-2">
                {analysis.grammarIssues?.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold text-amber-300">ATS / grammar checks</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {analysis.grammarIssues.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.improvementAreas?.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold text-amber-300">Improvement areas</h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {analysis.improvementAreas.map((a) => (
                        <span key={a} className="rounded-lg bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                          {a}
                        </span>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="glass-card p-6">
              <h3 className="font-semibold">AI suggestions</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {(analysis.aiSuggestions || analysis.suggestions || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            {analysis.suitableRoles?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-cyan-400">Suitable job roles</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.suitableRoles.map((r) => (
                    <span key={r} className="rounded-lg bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.careerSuggestions?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold">Career insights</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {analysis.careerSuggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.roadmapSuggestions?.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analysis.roadmapSuggestions.map((rm) => (
                  <div key={rm.title} className="glass-card p-5">
                    <h3 className="font-semibold text-electric-400">{rm.title}</h3>
                    <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                      {(rm.steps || []).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}

            {(analysis.recommendations?.length > 0 || analysis.recommendedProjects?.length > 0) && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card p-6">
                  <h3 className="font-semibold">Recommendations</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {(analysis.recommendations || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card p-6">
                  <h3 className="font-semibold">Suggested projects</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {(analysis.recommendedProjects || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
