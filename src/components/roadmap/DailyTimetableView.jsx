import { motion } from "framer-motion";
import GlowProgress from "../premium/GlowProgress.jsx";
import { safeTimetableGeneration } from "../../utils/careerSafe.js";

const ENERGY = {
  high: "border-cyan-500/40 text-cyan-300",
  medium: "border-violet-500/40 text-violet-300",
  low: "border-amber-500/40 text-amber-300",
};

export default function DailyTimetableView({
  timetable,
  analytics,
  onToggleSlot,
  onSkipSlot,
  loading,
}) {
  if (loading) {
    return (
      <div className="glass-card flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
      </div>
    );
  }

  const tt = safeTimetableGeneration(timetable);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {analytics ? (
        <motion.div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Study time" value={`${tt.totalMinutes} min`} />
          <Stat label="Productivity" value={`${analytics.productivityScore ?? tt.productivityScore}%`} />
          <Stat label="Focus" value={`${analytics.focusScore ?? tt.focusScore}%`} />
          <Stat label="Consistency" value={`${analytics.consistencyScore ?? tt.consistencyScore}%`} />
        </motion.div>
      ) : null}

      <GlowProgress
        value={analytics?.completionPercent ?? tt.consistencyScore}
        label="Timetable completion"
      />

      {tt.sessions.map((session) => (
        <section key={session.id} className="premium-card border border-electric-500/20 overflow-hidden">
          <header className="border-b border-white/5 px-5 py-4">
            <h3 className="font-display font-bold">
              {session.emoji} {session.label}
            </h3>
            <p className="text-xs text-slate-400">
              {session.startTime} — {session.endTime}
            </p>
          </header>
          <ul className="divide-y divide-white/5">
            {session.slots.map((slot, i) => (
              <SlotRow
                key={slot.taskId || String(i)}
                slot={slot}
                onToggle={onToggleSlot}
                onSkip={onSkipSlot}
              />
            ))}
          </ul>
        </section>
      ))}
    </motion.div>
  );
}

function Stat({ label, value }) {
  return (
    <motion.div className="glass-card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-display text-xl font-bold text-electric-400">{value}</p>
    </motion.div>
  );
}

function SlotRow({ slot, onToggle, onSkip }) {
  return (
    <li
      className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
        slot.isBreak ? "bg-white/[0.02]" : ""
      }`}
    >
      <motion.div className="flex items-start gap-3">
        {!slot.isBreak && onToggle ? (
          <button type="button" className="text-lg" onClick={() => onToggle(slot.taskId)}>
            {slot.completed ? "✅" : "⬜"}
          </button>
        ) : null}
        <motion.div>
          <p className={`text-sm ${slot.completed ? "line-through text-slate-500" : "text-slate-100"}`}>
            {slot.title}
          </p>
          <p className="mt-1 text-xs text-electric-400">
            {slot.startTime} – {slot.endTime} · {slot.durationMinutes} min
          </p>
        </motion.div>
      </motion.div>
      {!slot.isBreak ? (
        <motion.div className="flex flex-wrap gap-2 text-[10px]">
          <span className={`rounded-full border px-2 py-0.5 ${ENERGY[slot.energyLevel] || ENERGY.medium}`}>
            {slot.energyLevel}
          </span>
          {slot.focusSession ? (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">Focus</span>
          ) : null}
          {onSkip && !slot.completed ? (
            <button type="button" className="btn-ghost" onClick={() => onSkip(slot.taskId)}>
              Skip
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </li>
  );
}
