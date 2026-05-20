import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import StatusBadge from "../premium/StatusBadge.jsx";
import GlowProgress from "../premium/GlowProgress.jsx";

const STATUS_MAP = {
  completed: "completed",
  in_progress: "in_progress",
  locked: "locked",
  upcoming: "upcoming",
};

export default function RoadmapTimeline({ roadmap, progress, onToggleModule, saving }) {
  const [openPhase, setOpenPhase] = useState(0);
  const phaseProgress = progress?.phaseProgress || [];
  const completedModules = progress?.completedModules || [];

  if (!roadmap) return null;

  return (
    <motion.div layout className="space-y-4">
      <motion.div className="premium-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-slate-400">Estimated duration</p>
          <p className="font-display text-xl font-bold">{roadmap.estimatedDuration}</p>
        </div>
        <GlowProgress value={progress?.progress ?? 0} label="Overall completion" />
        <div className="flex flex-wrap gap-2">
          {(progress?.earnedBadges || roadmap.badges || []).map((b) => (
            <span key={b} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
              {b}
            </span>
          ))}
        </div>
      </motion.div>

      {roadmap.phases.map((phase, i) => {
        const pp = phaseProgress.find((p) => p.phaseIndex === i);
        const pct = pp?.progress ?? (i === 0 ? 5 : 0);
        const status = pp?.done ? "completed" : STATUS_MAP[phase.status] || (i === openPhase ? "in_progress" : "locked");

        return (
          <motion.div key={phase.title} className="premium-card overflow-hidden rounded-2xl border border-white/10">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
              onClick={() => setOpenPhase(openPhase === i ? -1 : i)}
            >
              <div>
                <p className="font-semibold">
                  🛣 Phase {i + 1}: {phase.title}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {phase.weeks} weeks · {phase.level}
                  {phase.estimatedHours ? ` · ~${phase.estimatedHours}h` : ""}
                </p>
                <span className="mt-1 inline-block rounded-full border border-electric-500/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-electric-400">
                  {phase.level === "expert" ? "👑 Expert" : phase.level === "advanced" ? "⚡ Advanced" : phase.level === "intermediate" ? "📈 Intermediate" : "🚀 Beginner"}
                </span>
              </div>
              <StatusBadge status={status} />
            </button>
            <AnimatePresence>
              {openPhase === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-gradient-to-b from-electric-500/5 to-transparent px-5 pb-5"
                  >
                  <GlowProgress value={pct} label="Phase progress" className="mt-3" />
                  <h4 className="mt-4 text-sm font-semibold text-electric-400">Modules</h4>
                  <ul className="mt-2 space-y-2">
                    {phase.modules.map((mod) => {
                      const done = completedModules.includes(mod) || pp?.completedModules?.includes(mod);
                      return (
                        <li key={mod} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
                          <span className={done ? "text-emerald-300 line-through" : "text-slate-300"}>
                            {done ? "✅" : "⬜"} {mod}
                          </span>
                          {!done && (
                            <button
                              type="button"
                              disabled={saving}
                              className="btn-ghost text-xs"
                              onClick={() => onToggleModule(i, mod)}
                            >
                              Mark done
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-semibold">🎯 Weekly targets</h4>
                      <ul className="mt-1 list-inside list-disc text-sm text-slate-400">
                        {phase.weeklyTargets?.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">🗓 Monthly goals</h4>
                      <ul className="mt-1 list-inside list-disc text-sm text-slate-400">
                        {phase.monthlyGoals?.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/interview?technology=${encodeURIComponent(roadmap.technology)}`}
                      className="btn-glow text-xs"
                    >
                      Mock interview prep
                    </Link>
                    <Link
                      to={`/planner?tech=${encodeURIComponent(roadmap.technology)}`}
                      className="btn-ghost text-xs"
                    >
                      Open planner
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
