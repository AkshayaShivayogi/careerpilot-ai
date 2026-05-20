import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function PremiumCard({
  to,
  icon,
  title,
  description,
  stats = [],
  cta = "Open",
  accent = "electric",
  delay = 0,
  onClick,
}) {
  const accents = {
    electric: "from-electric-500/20 to-cyan-500/5 border-electric-500/25",
    violet: "from-violet-500/20 to-fuchsia-500/5 border-violet-500/25",
    emerald: "from-emerald-500/20 to-teal-500/5 border-emerald-500/25",
    amber: "from-amber-500/20 to-orange-500/5 border-amber-500/25",
  };

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`premium-card group h-full bg-gradient-to-br p-[1px] ${accents[accent] || accents.electric}`}
    >
      <div className="flex h-full flex-col rounded-2xl bg-navy-950/90 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl">{icon}</span>
          <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-electric-400" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
        <p className="mt-2 flex-1 text-sm text-slate-400">{description}</p>
        {stats.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-white/5 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">{s.label}</p>
                <p className="text-sm font-semibold text-electric-300">{s.value}</p>
              </div>
            ))}
          </div>
        )}
        <span className="btn-glow mt-5 inline-flex w-fit text-sm">{cta}</span>
      </div>
    </motion.div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left">
      {inner}
    </button>
  );
}
