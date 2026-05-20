import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { safeApi } from "../services/api.js";

const FALLBACK = {
  summary: "Career guidance is temporarily unavailable. Explore roadmaps and practice interviews while we reconnect.",
  salaryGuidance: "Varies by role and region",
  recommendedTechnologies: ["React", "Python", "Java", "DSA"],
  skillsToLearn: ["Problem solving", "System design basics", "Communication"],
  roadmapRecommendation: "React",
  insights: ["Complete your profile for personalized tips.", "Try the Smart Learning Planner for a weekly schedule."],
};

export default function Guidance() {
  const [g, setG] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await safeApi.get("/guidance", {}, { fallback: FALLBACK });
      if (cancelled) return;
      const raw = result.data?.guidance ?? result.data?.summary != null ? result.data : result.data;
      const guidance = raw && typeof raw === "object" ? raw : FALLBACK;
      setG(guidance);
      if (result.usedFallback) setError("Showing offline guidance — reconnect for personalized tips.");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="glass-card p-8">Loading neural guidance…</div>;

  const data = g || FALLBACK;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Neural Career Guidance</h1>
      {error && <p className="text-sm text-amber-300">{error}</p>}
      <div className="glass-card p-6">
        <p className="text-slate-300">{data.summary}</p>
        <p className="mt-4 text-electric-400">Salary range: {data.salaryGuidance}</p>
      </div>
      <div className="glass-card p-6">
        <h2 className="font-semibold mb-2">Recommended technologies</h2>
        <div className="flex flex-wrap gap-2">
          {(data.recommendedTechnologies || []).map((t) => (
            <span key={t} className="rounded-full bg-electric-500/20 px-3 py-1 text-sm">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="glass-card p-6">
        <h2 className="font-semibold mb-2">Skills to learn</h2>
        <ul className="list-disc pl-5 text-sm">
          {(data.skillsToLearn || []).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <Link to="/roadmap" className="btn-glow mt-4 inline-block">
          Open {data.roadmapRecommendation || "React"} roadmap
        </Link>
      </div>
      <div className="glass-card p-6">
        <h2 className="font-semibold mb-2">AI insights</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          {(data.insights || []).map((i, idx) => (
            <li key={idx}>• {i}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
