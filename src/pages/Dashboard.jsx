import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { safeApi } from "../services/api.js";
import { DASHBOARD_FALLBACK } from "../data/apiFallbacks.js";
import PageHero from "../components/premium/PageHero.jsx";
import PremiumModuleGrid from "../components/dashboard/PremiumModuleGrid.jsx";
import SmartInsights from "../components/dashboard/SmartInsights.jsx";
import { getTopTrending } from "../data/trendingTechnologies.js";

function FeatureCard({ to, icon, title, subtitle, stats, cta, accent }) {
  return (
    <Link to={to} className="group block">
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        className={`glass-card relative overflow-hidden p-6 sm:p-8 transition ${accent}`}
        style={{ boxShadow: "0 0 32px rgba(14, 165, 233, 0.12)" }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-electric-500/10 blur-2xl transition group-hover:bg-electric-500/20" />
        <div className="relative">
          <span className="text-4xl">{icon}</span>
          <h2 className="mt-4 font-display text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-navy-900/60 p-3">
                <p className="text-xs uppercase text-slate-500">{s.label}</p>
                <p className="mt-1 font-display text-lg font-semibold text-electric-400">{s.value}</p>
              </div>
            ))}
          </div>
          <span className="btn-glow mt-6 inline-block">{cta}</span>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(DASHBOARD_FALLBACK);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await safeApi.get("/dashboard", {}, { fallback: DASHBOARD_FALLBACK });
      if (cancelled) return;
      setData(result.data?.stats != null || result.data?.features ? result.data : DASHBOARD_FALLBACK);
      setOffline(result.usedFallback);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
      </div>
    );
  }

  const resume = data.features?.resume || {};
  const interview = data.features?.interview || {};

  const stats = data.stats || {};
  const cards = [
    { label: "Learning streak", value: stats.learningStreak ?? 0, suffix: " days" },
    { label: "Roadmap progress", value: stats.roadmapProgress ?? 0, suffix: "%" },
    { label: "DSA solved", value: stats.dsaSolved ?? 0, suffix: "" },
    { label: "Profile", value: data.profileCompletion ?? 0, suffix: "%" },
  ];

  const topTrend = getTopTrending(1)[0];

  return (
    <div className="space-y-8">
      {offline && (
        <p className="text-sm text-amber-300/90">Showing offline dashboard — reconnect to sync live stats.</p>
      )}
      <PageHero
        emoji="🚀"
        title="CareerPilot AI"
        subtitle={`${data.welcome || "Welcome"}. Target: ${data.profile?.targetRole || "Set in Profile"}`}
      >
        {topTrend && (
          <div className="rounded-xl border border-electric-500/30 bg-electric-500/10 px-4 py-2 text-sm">
            🔥 Trending: {topTrend.name} ({topTrend.demand}% demand)
          </div>
        )}
      </PageHero>

      <PremiumModuleGrid
        resume={resume}
        interview={interview}
        stats={{
          learningStreak: data.stats.learningStreak,
          roadmapProgress: data.stats.roadmapProgress,
          dsaSolved: data.stats.dsaSolved,
          profileCompletion: data.profileCompletion,
        }}
      />

      <SmartInsights data={data} interview={interview} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FeatureCard
          to="/resume"
          icon="▤"
          title="AI Resume Analyzer"
          subtitle="ATS scoring, skill gaps, industry trends, and MongoDB analysis history."
          accent="border-electric-500/20 hover:border-electric-500/40"
          cta="Upload & analyze resume →"
          stats={[
            { label: "Avg ATS score", value: `${resume.avgScore ?? 0}%` },
            { label: "Analyses", value: resume.totalAnalyses ?? 0 },
            { label: "Last score", value: `${resume.lastScore ?? 0}%` },
            {
              label: "Last file",
              value: resume.lastFileName ? resume.lastFileName.slice(0, 18) : "—",
            },
          ]}
        />
        <FeatureCard
          to="/interview"
          icon="◈"
          title="AI Interview Engine"
          subtitle="100+ questions per tech, instant feedback, explanations, and session analytics."
          accent="border-cyan-500/20 hover:border-cyan-500/40"
          cta="Start interview practice →"
          stats={[
            { label: "Interview avg", value: `${interview.avgScore ?? 0}%` },
            { label: "Sessions", value: interview.totalSessions ?? 0 },
            { label: "Strongest", value: interview.strongestTech ?? "—" },
            { label: "Weakest", value: interview.weakestTech ?? "—" },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-5 transition hover:scale-[1.02]">
            <p className="text-xs uppercase text-slate-500">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-electric-400">
              {c.value}
              {c.suffix}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Interview scores</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data.charts.interviewScores.length ? data.charts.interviewScores : [{ name: "—", score: 0 }]}
            >
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Bar dataKey="score" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Resume score trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={data.charts.resumeScores.length ? data.charts.resumeScores : [{ name: "—", score: 0 }]}
            >
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis domain={[0, 100]} stroke="#64748b" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="mb-4 font-semibold">Recent activity</h3>
        <ul className="space-y-3">
          {(data.recentActivities || []).slice(0, 6).map((a, i) => (
            <li key={i} className="flex justify-between border-b border-white/5 pb-2 text-sm">
              <span>{a.message}</span>
              <span className="text-slate-500">{new Date(a.at).toLocaleDateString()}</span>
            </li>
          ))}
          {!data.recentActivities?.length && <li className="text-slate-500">No activity yet</li>}
        </ul>
      </div>
    </div>
  );
}
