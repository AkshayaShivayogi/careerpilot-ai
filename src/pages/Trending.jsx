import { useEffect, useMemo, useState } from "react";
import { safeApi } from "../services/api.js";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import PageHero from "../components/premium/PageHero.jsx";
import GlowProgress from "../components/premium/GlowProgress.jsx";
import ProgressRing from "../components/premium/ProgressRing.jsx";
import { TRENDING_CATEGORIES, ALL_TECHNOLOGIES } from "../data/trendingTechnologies.js";

const CATEGORY_KEYS = Object.keys(TRENDING_CATEGORIES);

function mapApiItem(item, categoryKey) {
  const demand = item.demand ?? 70;
  const hiringTrend = item.hiringTrend || "High";
  const hiring = hiringTrend === "High" ? 90 : hiringTrend === "Medium" ? 75 : 58;
  return {
    id: `gemini-${String(item.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: item.name,
    icon: "✨",
    demand,
    hiring,
    hiringTrend,
    growth: item.growth || "+10%",
    salaryLabel: item.salaryLabel || "₹10LPA",
    difficulty: item.difficulty || "Medium",
    categoryKey: categoryKey || "programming",
    categoryLabel: categoryKey,
    progress: Math.floor(demand * 0.35),
    level: "Intermediate",
    learningWeeks: 12,
    careers: item.recommendedSkills?.length ? item.recommendedSkills : ["Software Engineer"],
    geminiGenerated: true,
  };
}

export default function Trending() {
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(ALL_TECHNOLOGIES[0]?.id);
  const [technologies, setTechnologies] = useState(ALL_TECHNOLOGIES);
  const [geminiGenerated, setGeminiGenerated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeApi.get("/trending", {}, { fallback: {} }).then((result) => {
      const merged = [...ALL_TECHNOLOGIES];
      const seen = new Set(merged.map((x) => x.name.toLowerCase()));
      const payload = result.data || {};
      for (const [key, arr] of Object.entries(payload)) {
        if (!Array.isArray(arr) || key.startsWith("_") || key === "geminiGenerated" || key === "geminiEnabled")
          continue;
        for (const item of arr) {
          if (!item?.name || seen.has(item.name.toLowerCase())) continue;
          seen.add(item.name.toLowerCase());
          merged.unshift(mapApiItem(item, key));
        }
      }
      setTechnologies(merged);
      setGeminiGenerated(Boolean(payload.geminiGenerated));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = technologies;
    if (category !== "all") list = list.filter((t) => t.categoryKey === category);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(s));
    }
    return list;
  }, [category, q, technologies]);

  const selected = useMemo(
    () => technologies.find((t) => t.id === selectedId) || filtered[0],
    [selectedId, filtered, technologies]
  );

  const radarData = selected
    ? [
        { subject: "Demand", value: selected.demand },
        { subject: "Hiring", value: selected.hiring },
        { subject: "Growth", value: parseInt(selected.growth, 10) || 10 },
        { subject: "Progress", value: selected.progress },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHero
        emoji="🔥"
        title="Trending Technologies"
        subtitle="Advanced market insights: demand %, hiring trends, salaries, and recommended skills."
      />

      {loading && <p className="text-sm text-slate-500">Loading market insights…</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`rounded-xl px-4 py-2 text-sm ${category === "all" ? "bg-electric-500/20 text-electric-300" : "bg-white/5 text-slate-400"}`}
        >
          All
        </button>
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={`rounded-xl px-4 py-2 text-sm ${
              category === key ? "bg-electric-500/20 text-electric-300" : "bg-white/5 text-slate-400"
            }`}
          >
            {TRENDING_CATEGORIES[key].icon} {TRENDING_CATEGORIES[key].label}
          </button>
        ))}
        <input
          className="input-field min-w-[200px] flex-1"
          placeholder="Search technologies…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <motion.div layout className="grid gap-4 sm:grid-cols-2">
            {filtered.map((tech, i) => (
              <motion.article
                key={tech.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedId(tech.id)}
                className={`premium-card cursor-pointer rounded-2xl border bg-navy-950/80 p-5 transition ${
                  selected?.id === tech.id ? "border-electric-500/50" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tech.icon}</span>
                    <div>
                      <h3 className="font-semibold">{tech.name}</h3>
                      <p className="text-xs text-slate-500">{tech.categoryLabel}</p>
                    </div>
                  </div>
                  <ProgressRing value={tech.demand} size={56} stroke={5} />
                </div>
                <div className="mt-4 space-y-2">
                  <GlowProgress value={tech.demand} label="Demand" />
                  <GlowProgress value={tech.hiring} label="Hiring" color="violet" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                    {tech.hiringTrend} hiring
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-400">
                    {tech.difficulty}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-400">
                    {tech.salaryLabel}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/planner?tech=${encodeURIComponent(tech.name)}`}
                    className="btn-glow text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Learning roadmap
                  </Link>
                  <Link
                    to={`/interview?technology=${encodeURIComponent(tech.name)}`}
                    className="btn-ghost text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Mock interview
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>

        <aside className="glass-card sticky top-4 h-fit space-y-4 p-5">
          {selected && (
            <>
              <h3 className="font-display text-lg font-bold">
                {selected.icon} {selected.name}
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Demand: {selected.demand}%</li>
                <li>Hiring trend: {selected.hiringTrend}</li>
                <li>Growth: {selected.growth}</li>
                <li>Salary: {selected.salaryLabel}</li>
                <li>Difficulty: {selected.difficulty}</li>
                <li>Level: {selected.level}</li>
                <li>Est. learning: {selected.learningWeeks} weeks</li>
              </ul>
              <p className="text-sm text-slate-500">Careers: {selected.careers.join(", ")}</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b" }} />
                    <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </aside>
      </div>

      <div className="glass-card p-5">
        <h3 className="mb-4 font-semibold">Category demand comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={CATEGORY_KEYS.map((k) => ({
                name: TRENDING_CATEGORIES[k].label,
                demand: Math.round(
                  TRENDING_CATEGORIES[k].items.reduce((s, t) => s + t.demand, 0) /
                    TRENDING_CATEGORIES[k].items.length
                ),
              }))}
            >
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
              <YAxis domain={[0, 100]} stroke="#64748b" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Bar dataKey="demand" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
