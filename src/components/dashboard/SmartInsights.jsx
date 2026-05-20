import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getTopTrending, recommendNextTech } from "../../data/trendingTechnologies.js";

export default function SmartInsights({ data, interview }) {
  const top = getTopTrending(1)[0];
  const next = recommendNextTech([]);
  const tips = [
    interview?.weakestTech && interview.weakestTech !== "—"
      ? `Strengthen ${interview.weakestTech} with targeted mock interviews.`
      : "Start an interview session to unlock skill gap analysis.",
    top ? `High demand alert: ${top.name} (${top.demand}% demand, ${top.hiringTrend} hiring).` : null,
    next ? `Recommended next track: ${next.name} — ${next.learningWeeks} week learning path.` : null,
    data?.profile?.targetRole
      ? `Align learning with your target role: ${data.profile.targetRole}.`
      : "Set your target role in Profile for personalized recommendations.",
  ].filter(Boolean);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card border border-violet-500/15 p-6"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-400" />
        <h2 className="font-display text-lg font-semibold">Smart insights</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {tips.map((tip, i) => (
          <li key={i} className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-300">
            {tip}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/trending" className="btn-ghost text-sm">
          Trending tech
        </Link>
        <Link to="/planner" className="btn-glow text-sm">
          Open planner
        </Link>
      </div>
    </motion.section>
  );
}
