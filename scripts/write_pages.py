from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "pages"
BAD_OPEN = "<" + "motion.div"
BAD_CLOSE = "</" + "motion.div" + ">"
GOOD_OPEN = "<div"
GOOD_CLOSE = "</div>"


def fix(t):
    return t.replace(BAD_OPEN, GOOD_OPEN).replace(BAD_CLOSE, GOOD_CLOSE)


DSA = fix("""
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../services/api.js";

export default function Dsa() {
  const [dsa, setDsa] = useState(null);
  useEffect(() => { api.get("/dsa").then((r) => setDsa(r.data.dsa)); }, []);
  async function markSolved(topic) {
    const { data } = await api.patch("/dsa", { topic, increment: 1 });
    setDsa(data.dsa);
  }
  if (!dsa) return <div className="glass-card p-8 text-center">Loading…</motion.div>;
  const chartData = Object.entries(dsa.topics || {}).map(([name, v]) => ({ name, solved: v.solved, total: v.total }));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5"><p className="text-xs text-slate-500">Solved</p><p className="text-3xl font-bold text-electric-400">{dsa.solvedCount}</p></motion.div>
        <motion.div className="glass-card p-5"><p className="text-xs text-slate-500">Streak</p><p className="text-3xl font-bold text-electric-400">{dsa.streak} days</p></motion.div>
        <motion.div className="glass-card p-5"><p className="text-xs text-slate-500">Topics</p><p className="text-3xl font-bold text-electric-400">{chartData.length}</p></motion.div>
      </motion.div>
      <motion.div className="glass-card p-6">
        <h2 className="font-semibold mb-4">Topic progress</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}><XAxis dataKey="name" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip /><Bar dataKey="solved" fill="#0ea5e9" /></BarChart>
        </ResponsiveContainer>
        <motion.div className="mt-4 flex flex-wrap gap-2">
          {chartData.map((t) => (
            <button key={t.name} type="button" className="btn-ghost text-sm" onClick={() => markSolved(t.name)}>+1 {t.name}</button>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
""")

# The template above still has motion - run fix on result
for name, raw in [
    ("Dsa.jsx", DSA),
]:
    (ROOT / name).write_text(fix(raw), encoding="utf-8")

print("done")
