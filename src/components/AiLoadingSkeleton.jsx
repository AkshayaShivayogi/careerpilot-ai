import { motion } from "framer-motion";

export default function AiLoadingSkeleton({ rows = 4, label = "Gemini is generating…" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card space-y-4 p-8"
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="h-10 w-10 rounded-full border-2 border-violet-500/30 border-t-violet-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <p className="text-slate-400">{label}</p>
      </div>
      <motion.div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <motion.div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-gradient-to-r from-navy-800/80 via-violet-900/20 to-navy-800/80"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
