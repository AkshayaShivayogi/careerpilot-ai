import { motion } from "framer-motion";

export default function RoadmapInsights({ roadmap }) {
  if (!roadmap) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 lg:grid-cols-3"
    >
      <motion.div
        className="premium-card border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-navy-950/80 p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
        whileHover={{ scale: 1.01 }}
      >
        <p className="text-xs font-medium text-cyan-400">📈 Salary insights</p>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          <li>Entry: {roadmap.salaryInsights?.entry || "—"}</li>
          <li>Mid: {roadmap.salaryInsights?.mid || "—"}</li>
          <li>Senior: {roadmap.salaryInsights?.senior || "—"}</li>
        </ul>
      </motion.div>

      <motion.div className="premium-card border border-violet-500/20 p-5">
        <p className="text-xs font-medium text-violet-400">🔥 Hiring demand</p>
        <p className="mt-2 font-display text-2xl font-bold text-violet-300">{roadmap.hiringDemand || "High"}</p>
        <p className="mt-2 text-sm text-slate-400">{roadmap.industryRelevance}</p>
      </motion.div>

      <motion.div className="premium-card border border-amber-500/20 p-5">
        <p className="text-xs font-medium text-amber-400">🎯 Career paths</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {(roadmap.careerOpportunities || []).map((c) => (
            <span key={c} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100">
              {c}
            </span>
          ))}
        </ul>
      </motion.div>

      <motion.div className="premium-card col-span-full border border-emerald-500/20 p-5 lg:col-span-3">
        <p className="text-xs font-medium text-emerald-400">⚡ Trending in {roadmap.technology}</p>
        <motion.div className="mt-3 flex flex-wrap gap-2">
          {(roadmap.trendingTechnologies || []).map((t) => (
            <span
              key={t}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
            >
              {t}
            </span>
          ))}
        </motion.div>
        {(roadmap.prerequisites?.length > 0) && (
          <p className="mt-3 text-sm text-slate-400">
            📚 Prerequisites: {roadmap.prerequisites.join(" · ")}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
