import { motion } from "framer-motion";

export default function RoadmapDependencyGraph({ graph = [] }) {
  if (!graph.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="premium-card overflow-x-auto p-5"
    >
      <h3 className="text-sm font-semibold text-electric-400">🧠 Learning dependency graph</h3>
      <motion.div className="mt-4 flex min-w-[600px] items-center gap-2">
        {graph.map((node, i) => (
          <div key={node.id} className="flex items-center gap-2">
            <motion.div
              className="rounded-xl border border-electric-500/40 bg-electric-500/10 px-3 py-2 text-center text-xs text-slate-200 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
              whileHover={{ scale: 1.05, boxShadow: "0 0 28px rgba(56,189,248,0.35)" }}
            >
              <span className="block text-[10px] text-electric-400">Phase {i + 1}</span>
              <span className="line-clamp-2 max-w-[120px]">{node.label}</span>
            </motion.div>
            {i < graph.length - 1 && (
              <span className="text-electric-500/60" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
