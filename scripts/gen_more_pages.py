from pathlib import Path
ROOT = Path(r"C:\projects\CAREERPILOT-AI\src\pages")

def w(n, b):
    b = b.replace("<motion.div", "<motion.div").replace("</motion.div>", "</motion.div>")
    b = b.replace("<motion.div", "<motion.div").replace("</motion.div>", "</motion.div>")
    b = b.replace("<motion.div", "<motion.div").replace("<motion.div", "<div").replace("</motion.div>", "</div>")
    (ROOT/n).write_text(b.strip()+"\n", encoding="utf-8")
    print(n)

# fix w function - only one replace
def w(n, b):
    b = b.replace("<motion.div", "<div").replace("</motion.div>", "</motion.div>").replace("</motion.div>", "</div>")
    (ROOT/n).write_text(b.strip()+"\n", encoding="utf-8")
    print(n)

w("Trending.jsx", """
import { useEffect, useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import api from "../services/api.js";

const CATS = ["frontend","backend","languages","database","cloud","stacks","ai"];

export default function Trending() {
  const [data, setData] = useState(null);
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  useEffect(() => { api.get("/trending").then((r) => setData(r.data)); }, []);
  const filtered = useMemo(() => {
    if (!data) return {};
    const out = {};
    for (const [k, items] of Object.entries(data)) {
      if (category !== "all" && k !== category) continue;
      out[k] = items.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()));
    }
    return out;
  }, [data, category, q]);
  if (!data) return <div className="glass-card p-8">Loading…</motion.div>;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Trending Technologies</motion.div>
      <div className="flex flex-wrap gap-3">
        <select className="input-field" value={category} onChange={(e)=>setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATS.map((c)=><option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input-field flex-1 min-w-[200px]" placeholder="Search tech…" value={q} onChange={(e)=>setQ(e.target.value)} />
      </motion.div>
      {Object.entries(filtered).map(([cat, items]) => items.length ? (
        <section key={cat}>
          <h2 className="text-lg text-electric-400 capitalize mb-3">{cat}</motion.div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <div key={t.name} className="glass-card p-4">
                <p className="font-semibold">{t.name}</motion.div>
                <p className="text-sm text-slate-400">Demand {t.demand}% · {t.growth}</motion.div>
                <div className="mt-2 h-2 rounded bg-navy-800"><div className="h-full bg-electric-500 rounded" style={{width:`${t.demand}%`}}/></motion.div>
                <p className="text-xs text-slate-500 mt-1">Hiring {t.hiring}% · Salary ~${t.salary?.toLocaleString()}</motion.div>
              </motion.div>
            ))}
          </motion.div>
          <div className="glass-card mt-4 p-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={items}><XAxis dataKey="name" tick={{fontSize:9}} stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip/><Line type="monotone" dataKey="demand" stroke="#0ea5e9" strokeWidth={2}/></LineChart>
            </ResponsiveContainer>
          </motion.div>
        </section>
      ) : null)}
    </motion.div>
  );
}
""")
