import { motion } from "framer-motion";

export default function PageHero({ emoji, title, subtitle, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-hero relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8"
    >
      <motion.div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-electric-500/15 blur-3xl"
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ repeat: Infinity, duration: 5 }}
      />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {emoji && <span className="text-3xl">{emoji}</span>}
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl lg:text-4xl premium-gradient-text">
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-2xl text-slate-400">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap gap-3">{children}</div>}
      </div>
    </motion.section>
  );
}
