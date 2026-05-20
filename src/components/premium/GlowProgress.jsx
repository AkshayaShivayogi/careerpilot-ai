import { motion } from "framer-motion";

export default function GlowProgress({ value, label, color = "electric" }) {
  const colors = {
    electric: "from-electric-500 to-cyan-400",
    violet: "from-violet-500 to-fuchsia-400",
    emerald: "from-emerald-500 to-teal-400",
  };

  return (
    <div className="w-full">
      {(label || value != null) && (
        <div className="mb-1 flex justify-between text-xs">
          {label && <span className="text-slate-400">{label}</span>}
          {value != null && <span className="font-medium text-slate-200">{value}%</span>}
        </div>
      )}
      <motion.div className="h-2 overflow-hidden rounded-full bg-navy-800 ring-1 ring-white/5">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color] || colors.electric}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </motion.div>
    </div>
  );
}
