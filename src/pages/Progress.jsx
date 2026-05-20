import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  CartesianGrid,
} from "recharts";
import { safeApi } from "../services/api.js";
import PageHero from "../components/premium/PageHero.jsx";
import GlowProgress from "../components/premium/GlowProgress.jsx";

const PIE_COLORS = ["#0ea5e9", "#8b5cf6", "#22c55e", "#f59e0b"];

export default function Progress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fallback = {
        metrics: {
          dsaMastery: 12,
          roadmapProgressAvg: 8,
          interviewAvg: 0,
          dailyTargetRate: 25,
          learningStreak: 0,
          studyHoursEstimate: 0,
          weeklyTargetsCompleted: 0,
          bestResumeScore: 0,
          feedbackCount: 0,
          interviewTrend: [{ name: "Practice", score: 0 }],
        },
        achievements: [],
        history: [],
        insights: ["Reconnect to sync live progress analytics."],
      };
      const result = await safeApi.get("/analytics/progress", {}, { fallback });
      if (!cancelled) {
        setData(result.data?.metrics != null ? result.data : fallback);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
      </div>
    );
  }

  const m = data?.metrics || {};
  const pieData = [
    { name: "DSA", value: m.dsaMastery || 0 },
    { name: "Roadmap", value: m.roadmapProgressAvg || 0 },
    { name: "Interview", value: m.interviewAvg || 0 },
    { name: "Daily targets", value: m.dailyTargetRate || 0 },
  ];

  const radarSkills = [
    { subject: "DSA", value: m.dsaMastery || 0 },
    { subject: "Roadmaps", value: m.roadmapProgressAvg || 0 },
    { subject: "Interviews", value: m.interviewAvg || 0 },
    { subject: "Resume", value: m.bestResumeScore || 0 },
    { subject: "Consistency", value: m.weeklyTargetsCompleted * 10 || 0 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <PageHero
        emoji="📈"
        title="Progress Tracking"
        subtitle="Your complete learning journey — roadmaps, DSA, interviews, targets, and achievements."
      >
        <Link to="/achievements" className="btn-ghost text-sm">
          🏆 Achievements
        </Link>
      </PageHero>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Roadmap completion", value: `${m.roadmapProgressAvg ?? 0}%`, emoji: "🛣" },
          { label: "DSA mastery", value: `${m.dsaMastery ?? 0}%`, emoji: "🧩" },
          { label: "Interview avg", value: `${m.interviewAvg ?? 0}%`, emoji: "🎯" },
          { label: "Achievements", value: data?.achievements?.filter((a) => a.unlocked).length ?? 0, emoji: "🏆" },
          { label: "Streak", value: `${m.learningStreak ?? 0}d`, emoji: "🔥" },
          { label: "Study hours (est.)", value: m.studyHoursEstimate ?? 0, emoji: "📚" },
          { label: "Daily targets today", value: `${m.dailyTargetRate ?? 0}%`, emoji: "⚡" },
          { label: "Feedback shared", value: m.feedbackCount ?? 0, emoji: "💬" },
        ].map((card) => (
          <div key={card.label} className="glass-card p-4">
            <p className="text-xs text-slate-500">
              {card.emoji} {card.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-electric-400">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Skill balance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarSkills}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Progress distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {m.interviewTrend?.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Interview performance trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={m.interviewTrend}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis domain={[0, 100]} stroke="#64748b" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data?.history?.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">📈 Growth timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.history}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Bar dataKey="dsaSolved" fill="#0ea5e9" name="DSA" />
              <Bar dataKey="roadmapProgress" fill="#22c55e" name="Roadmap %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card p-5">
        <h3 className="mb-3 font-semibold">Overall mastery</h3>
        <GlowProgress value={m.dsaMastery ?? 0} label="DSA mastery" />
        <div className="mt-3">
          <GlowProgress value={m.roadmapProgressAvg ?? 0} label="Roadmap completion" color="emerald" />
        </div>
      </div>

      {data?.insights?.length > 0 && (
        <div className="glass-card border border-violet-500/20 p-5">
          <h3 className="font-semibold">💡 Personalized insights</h3>
          <ul className="mt-3 space-y-2">
            {data.insights.map((tip, i) => (
              <li key={i} className="rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
