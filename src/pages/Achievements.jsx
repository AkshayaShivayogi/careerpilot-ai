import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { safeApi } from "../services/api.js";
import PageHero from "../components/premium/PageHero.jsx";
import GlowProgress from "../components/premium/GlowProgress.jsx";
import { safeAchievementUnlock, TIER_EMOJI } from "../utils/careerSafe.js";
import { useLiveProgress } from "../hooks/useLiveProgress.js";

export default function Achievements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(null);
  const { live } = useLiveProgress();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fallback = { achievements: [], timeline: [], xp: 0, level: 1 };
      const result = await safeApi.get("/achievements", {}, { fallback });
      if (!cancelled) {
        setData(Array.isArray(result.data?.achievements) ? result.data : fallback);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
      </div>
    );
  }

  const achievements = safeAchievementUnlock(data?.achievements || []);
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);
  const xp = data?.xp ?? live?.xp ?? 0;
  const level = data?.level ?? live?.level ?? 1;
  const xpPct = ((xp % 500) / 500) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <PageHero
        emoji="🏆"
        title="Achievements"
        subtitle="Bronze → Legendary badges, XP levels, and milestone celebrations."
      >
        <Link to="/progress" className="btn-glow text-sm">
          📈 Live progress
        </Link>
      </PageHero>

      <motion.div className="premium-card border border-violet-500/30 bg-gradient-to-r from-violet-950/50 to-navy-950 p-6">
        <motion.div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Level {level}</p>
            <p className="font-display text-3xl font-bold text-violet-300">{xp} XP</p>
          </div>
          <GlowProgress value={xpPct} label="Progress to next level" />
        </motion.div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-4">
        <motion.div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-amber-300">{unlocked.length}</p>
          <p className="text-xs text-slate-400">Unlocked</p>
        </motion.div>
        <motion.div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-slate-400">{locked.length}</p>
          <p className="text-xs text-slate-400">Locked</p>
        </motion.div>
        <motion.div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-electric-400">{data?.metrics?.learningStreak ?? live?.taskStreak ?? 0}d</p>
          <p className="text-xs text-slate-400">Streak</p>
        </motion.div>
        <motion.div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">+{unlocked.reduce((s, a) => s + (a.xpReward || 0), 0)}</p>
          <p className="text-xs text-slate-400">XP earned</p>
        </motion.div>
      </div>

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setCelebrate(null)}
          >
            <motion.div className="premium-card max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-6xl">{celebrate.icon}</p>
              <p className="mt-4 font-display text-xl font-bold">{celebrate.name}</p>
              <p className="text-amber-300">+{celebrate.xpReward} XP</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <h2 className="mb-4 font-semibold text-emerald-400">✅ Unlocked badges</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unlocked.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="premium-card border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-[0_0_24px_rgba(52,211,153,0.12)]"
            >
              <span className="text-4xl">{a.icon}</span>
              <span className="ml-2 text-lg">{TIER_EMOJI[a.tier] || "🥉"}</span>
              <h3 className="mt-2 font-semibold">{a.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{a.description}</p>
              <p className="mt-2 text-xs text-amber-300">+{a.xpReward} XP</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-semibold text-slate-400">🔒 Locked badges</h2>
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locked.map((a) => (
            <motion.div key={a.id} className="glass-card p-5 opacity-70 grayscale">
              <span className="text-4xl opacity-50">{a.icon}</span>
              <span className="ml-2">{TIER_EMOJI[a.tier]}</span>
              <h3 className="mt-2 font-semibold">{a.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{a.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </motion.div>
  );
}
