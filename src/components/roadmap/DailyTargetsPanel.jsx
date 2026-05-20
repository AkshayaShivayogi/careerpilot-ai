import { motion } from "framer-motion";
import GlowProgress from "../premium/GlowProgress.jsx";
import { safeDailyTargetGeneration } from "../../utils/careerSafe.js";

const CATEGORY_EMOJI = {
  roadmap: "🛣",
  dsa: "📊",
  interview: "🎯",
  revision: "📚",
  project: "🛠",
  practice: "⚡",
  theory: "📖",
  coding: "💻",
  quiz: "❓",
  debug: "🐛",
};

export default function DailyTargetsPanel({ dailyTarget, loading, onToggle, onRegenerate, onCompleteAll }) {
  if (loading) {
    return (
      <motion.div className="glass-card flex h-40 items-center justify-center">
        <motion.div className="h-8 w-8 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
      </motion.div>
    );
  }

  const target = safeDailyTargetGeneration(dailyTarget);
  if (!target.tasks.length) {
    return <p className="text-slate-500">No targets for today yet.</p>;
  }

  const estimated = target.tasks.reduce((s, t) => s + (t.estimatedMinutes || 30), 0);
  const allDone = target.completionPercent >= 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <motion.div
        className="premium-card border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-navy-950/90 p-5 shadow-[0_0_40px_rgba(34,211,238,0.1)]"
        layout
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <motion.div>
            <h2 className="font-display text-lg font-bold">📅 Today&apos;s AI targets</h2>
            <p className="text-sm text-slate-400">
              {target.technology} · {target.date} · Streak {target.streak}d · ~{estimated} min
            </p>
            {target.meta?.difficultyBand && (
              <p className="mt-1 text-xs text-cyan-400">⚡ Band: {target.meta.difficultyBand}</p>
            )}
            {target.meta?.courseComplete && (
              <p className="mt-1 text-xs text-amber-300">🏆 Roadmap mastered — maintenance mode</p>
            )}
          </motion.div>
          <GlowProgress value={target.completionPercent} label="Daily completion" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost text-sm" onClick={onRegenerate}>
            Regenerate
          </button>
          {onCompleteAll && !allDone && (
            <button type="button" className="btn-glow text-sm" onClick={onCompleteAll}>
              Complete all &amp; plan tomorrow
            </button>
          )}
        </div>
        {target.productivityHint && (
          <p className="mt-2 text-xs text-slate-500">🧠 {target.productivityHint}</p>
        )}
      </motion.div>

      <ul className="space-y-3">
        {target.tasks.map((task) => (
          <motion.li
            key={task._id}
            layout
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition hover:scale-[1.01] ${
              task.completed
                ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_16px_rgba(52,211,153,0.15)]"
                : "border-white/10 bg-navy-950/80"
            }`}
            onClick={() => onToggle(task._id)}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-lg">{task.completed ? "✅" : "⬜"}</span>
            <div className="flex-1">
              <p className={`text-sm ${task.completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                {CATEGORY_EMOJI[task.category] || "📌"} {task.title}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {task.category}
                {task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : ""}
                {task.rescheduled ? " · rescheduled" : ""}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>

      {allDone && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-emerald-400"
        >
          🎉 Today complete — tomorrow&apos;s tasks are queued automatically.
        </motion.p>
      )}
    </motion.div>
  );
}
