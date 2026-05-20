import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import api, { safeApi } from "../services/api.js";
import { DSA_FALLBACK, ANALYTICS_FALLBACK } from "../data/apiFallbacks.js";
import PageHero from "../components/premium/PageHero.jsx";
import GlowProgress from "../components/premium/GlowProgress.jsx";
import { safeAnalyticsRender } from "../utils/careerSafe.js";
import { useLiveProgress } from "../hooks/useLiveProgress.js";

const LEVELS = ["beginner", "intermediate", "advanced"];

export default function Dsa() {
  const [dsa, setDsa] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [levelFilter, setLevelFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { live, refresh: refreshLive } = useLiveProgress();

  async function load() {
    setLoading(true);
    const [dsaResult, analyticsResult] = await Promise.all([
      safeApi.get("/dsa", {}, { fallback: DSA_FALLBACK }),
      safeApi.get("/analytics", {}, { fallback: ANALYTICS_FALLBACK }),
    ]);
    const dsaPayload = safeAnalyticsRender(dsaResult.data?.dsa ?? dsaResult.data ?? DSA_FALLBACK);
    const analyticsPayload = analyticsResult.data?.data ?? analyticsResult.data ?? ANALYTICS_FALLBACK;
    setDsa(dsaPayload?.topics ? dsaPayload : { ...DSA_FALLBACK, ...dsaPayload });
    setAnalytics(analyticsPayload ?? ANALYTICS_FALLBACK);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markSolved(slug) {
    const result = await safeApi.patch("/dsa", { topic: slug, increment: 1 }, {}, { fallback: dsa || DSA_FALLBACK });
    const next = result.data?.dsa ?? result.data;
    if (next?.topics) setDsa(safeAnalyticsRender(next));
    if (result.data?.live) refreshLive();
    if (result.ok && result.data?.achievementsUnlocked) load();
  }

  const topics = useMemo(() => {
    const list = dsa?.topics || [];
    if (levelFilter === "all") return list;
    return list.filter((t) => t.level === levelFilter);
  }, [dsa, levelFilter]);

  const chartTopics = (topics.length ? topics : DSA_FALLBACK.topics).slice(0, 12);
  const radarSource = (dsa?.topics?.length ? dsa.topics : DSA_FALLBACK.topics).slice(0, 8);
  const radarData = radarSource.map((t) => ({
    subject: t.name.length > 10 ? t.name.slice(0, 9) + "…" : t.name,
    value: t.progress ?? 0,
  }));
  const analyticsSafe = analytics ?? ANALYTICS_FALLBACK;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <PageHero
        emoji="📊"
        title="Skill Analytics"
        subtitle="Dynamic DSA mastery, learning velocity, and AI-powered recommendations."
      />

      {live && (
        <motion.div className="glass-card border border-violet-500/20 p-4 text-sm text-slate-300">
          ⚡ Live: Lv.{live.level} · {live.xp} XP · Focus {live.focusScore}% · Consistency {live.consistencyLevel}
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500">Problems solved</p>
          <p className="font-display text-3xl font-bold text-electric-400">{dsa?.solvedCount ?? 0}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500">DSA streak</p>
          <p className="font-display text-3xl font-bold text-amber-400">{dsa?.streak ?? 0}d</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500">Mastery</p>
          <p className="font-display text-3xl font-bold text-emerald-400">{dsa?.completionPct ?? 0}%</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500">Learning speed</p>
          <p className="font-display text-xl font-bold text-violet-300">
            {analyticsSafe.velocity?.learningSpeed ?? "Building"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">📈 Topic progress</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartTopics}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Bar dataKey="solved" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">🧠 Skill radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {(analyticsSafe.weeklyConsistency?.length > 0) && (
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">📅 Weekly consistency</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={analyticsSafe.weeklyConsistency}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis domain={[0, 100]} stroke="#64748b" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="completed" stroke="#22d3ee" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card p-5">
        <h3 className="mb-4 font-semibold">🔥 Practice heatmap</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(analyticsSafe.metrics?.heatmap?.length ? analyticsSafe.metrics.heatmap : chartTopics).map((t) => (
            <div
              key={t.topic || t.name}
              className="rounded-lg border border-white/10 p-3 text-center transition hover:scale-105"
              style={{
                background: `rgba(14, 165, 233, ${Math.max(0.08, (t.value ?? t.progress) / 120)})`,
              }}
            >
              <p className="text-xs font-medium">{t.topic || t.name}</p>
              <p className="mt-1 text-lg font-bold text-electric-300">{t.value ?? t.progress}%</p>
            </div>
          ))}
        </div>
      </div>

      <motion.div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setLevelFilter("all")}
          className={`rounded-xl px-4 py-2 text-sm ${levelFilter === "all" ? "bg-electric-500/20 text-electric-300" : "bg-white/5 text-slate-400"}`}
        >
          All
        </button>
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevelFilter(l)}
            className={`rounded-xl px-4 py-2 text-sm capitalize ${
              levelFilter === l ? "bg-electric-500/20 text-electric-300" : "bg-white/5 text-slate-400"
            }`}
          >
            {l}
          </button>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card border border-emerald-500/20 p-5">
          <p className="text-sm text-emerald-400">🏆 Strongest: {dsa?.strongestTopic || "—"}</p>
        </div>
        <div className="glass-card border border-amber-500/20 p-5">
          <p className="text-sm text-amber-300">⚠ Weakest: {dsa?.weakestTopic || "—"}</p>
        </div>
      </div>

      {(analyticsSafe.recommendations?.length > 0) && (
        <div className="glass-card p-5">
          <h3 className="font-semibold">💡 Smart recommendations</h3>
          <ul className="mt-3 space-y-2">
            {analyticsSafe.recommendations.map((r, i) => (
              <li key={i} className="rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300">
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">🧩 DSA topics</h3>
        {topics.map((t) => (
          <motion.div
            key={t.slug}
            layout
            className="premium-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{t.name}</span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs capitalize text-slate-400">
                  {t.level}
                </span>
                {t.weak && <span className="text-xs text-amber-400">⚠ Weak</span>}
                {t.strong && <span className="text-xs text-emerald-400">Strong</span>}
              </div>
              <GlowProgress value={t.progress} label={`${t.solved}/${t.total} solved`} />
              <p className="mt-2 text-xs text-slate-500">💡 {t.recommended}</p>
            </div>
            <button type="button" className="btn-glow shrink-0 text-sm" onClick={() => markSolved(t.slug)}>
              +1 solved
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
