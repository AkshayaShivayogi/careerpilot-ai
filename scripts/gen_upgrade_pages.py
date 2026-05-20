from pathlib import Path

ROOT = Path(r"C:\projects\CAREERPILOT-AI\src\pages")

def w(name, body):
    body = body.replace("<motion.div", "<motion.div").replace("</motion.div>", "</motion.div>")
    body = body.replace("<motion.div", "<div").replace("</motion.div>", "</div>")
    (ROOT / name).write_text(body.strip() + "\n", encoding="utf-8")
    print("wrote", name)

w("Resume.jsx", """
import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import api from "../services/api.js";
import { getErrorMessage } from "../utils/httpError.js";

export default function Resume() {
  const [resumes, setResumes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [targetRole, setTargetRole] = useState("software engineer");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/resume").then((r) => {
      setResumes(r.data.resumes || []);
      setRoles(r.data.targetRoles || []);
    });
  }, []);

  async function upload(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("resume", file);
    fd.append("targetRole", targetRole);
    try {
      const { data } = await api.post("/resume/upload", fd);
      setResumes(data.resumes);
      setFile(null);
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"));
    } finally { setLoading(false); }
  }

  const latest = resumes[0];
  const radar = latest?.skillRadar || [];
  const meters = latest ? [
    { name: "ATS", value: latest.atsScore },
    { name: "Keywords", value: latest.keywordScore },
    { name: "Format", value: latest.formattingScore },
    { name: "Grammar", value: latest.grammarScore },
  ] : [];

  return (
    <motion.div className="space-y-6">
      <motion.div className="glass-card p-6">
        <h1 className="font-display text-2xl font-bold">ATS Resume Analyzer</h1>
        <form onSubmit={upload} className="mt-4 flex flex-wrap gap-3 items-end">
          <select className="input-field max-w-xs" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input type="file" accept=".pdf,.doc,.docx,.txt" className="input-field" onChange={(e) => setFile(e.target.files?.[0])} />
          <button type="submit" className="btn-glow" disabled={loading || !file}>{loading ? "Analyzing…" : "Upload & analyze"}</button>
        </form>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </motion.div>
      {latest && (
        <>
          <motion.div className="grid gap-4 lg:grid-cols-4">
            {meters.map((m) => (
              <motion.div key={m.name} className="glass-card p-4 text-center">
                <p className="text-xs text-slate-500">{m.name}</p>
                <p className="text-3xl font-bold text-electric-400">{m.value}%</p>
              </motion.div>
            ))}
          </motion.div>
          <motion.div className="grid gap-6 lg:grid-cols-2">
            <motion.div className="glass-card p-6">
              <h2 className="font-semibold mb-2">Overall ATS: {latest.overallScore}%</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={meters}><XAxis dataKey="name" stroke="#64748b" /><YAxis stroke="#64748b" domain={[0,100]} /><Tooltip /><Bar dataKey="value" fill="#0ea5e9" /></BarChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div className="glass-card p-6 h-64">
              <h2 className="font-semibold mb-2">Skill radar</h2>
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart data={radar}><PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="skill" tick={{ fill: "#94a3b8", fontSize: 10 }} /><Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} /></RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
          <motion.div className="grid gap-6 lg:grid-cols-2">
            <motion.div className="glass-card p-6"><h3 className="font-semibold text-emerald-400">Strengths</h3><ul className="mt-2 list-disc pl-5 text-sm">{(latest.strengths||[]).map((s,i)=><li key={i}>{s}</li>)}</ul></motion.div>
            <motion.div className="glass-card p-6"><h3 className="font-semibold text-red-400">Weaknesses</h3><ul className="mt-2 list-disc pl-5 text-sm">{(latest.weaknesses||[]).map((s,i)=><li key={i}>{s}</li>)}</ul></motion.div>
          </motion.div>
          <motion.div className="glass-card p-6"><h3 className="font-semibold">Suggestions</h3><ul className="mt-2 list-disc pl-5 text-sm space-y-1">{(latest.suggestions||[]).map((s,i)=><li key={i}>{s}</li>)}</ul></motion.div>
        </>
      )}
    </motion.div>
  );
}
""")

w("Saved.jsx", """
import { useEffect, useState } from "react";
import api from "../services/api.js";

export default function Saved() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/saved").then((r) => setData(r.data)); }, []);
  if (!data) return <motion.div className="glass-card p-8">Loading saved items…</motion.div>;
  return (
    <motion.div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Saved library</h1>
      <motion.div className="glass-card p-6"><h2 className="text-electric-400 mb-3">Roadmaps</h2>{(data.roadmaps||[]).map(r=><p key={r._id} className="text-sm py-1 border-b border-white/5">{r.title}</p>)}{!data.roadmaps?.length && <p className="text-slate-500 text-sm">None</p>}</motion.div>
      <motion.div className="glass-card p-6"><h2 className="text-electric-400 mb-3">Interviews</h2>{(data.interviewSessions||[]).map(s=><p key={s._id} className="text-sm py-1">{s.stream} — {s.score}%</p>)}</motion.div>
      <motion.div className="glass-card p-6"><h2 className="text-electric-400 mb-3">Resumes</h2>{(data.resumes||[]).map(r=><p key={r._id} className="text-sm py-1">{r.fileName}</p>)}</motion.div>
      <motion.div className="glass-card p-6"><h2 className="text-electric-400 mb-3">Bookmarked questions</h2>{(data.bookmarkedQuestions||[]).map(q=><p key={q._id} className="text-sm py-2 border-b border-white/5">{q.question?.slice(0,120)}…</p>)}</motion.div>
    </motion.div>
  );
}
""")

w("Guidance.jsx", """
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function Guidance() {
  const [g, setG] = useState(null);
  useEffect(() => { api.get("/guidance").then((r) => setG(r.data.guidance)); }, []);
  if (!g) return <motion.div className="glass-card p-8">Loading neural guidance…</motion.div>;
  return (
    <motion.div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Neural Career Guidance</h1>
      <motion.div className="glass-card p-6"><p className="text-slate-300">{g.summary}</p><p className="mt-4 text-electric-400">Salary range: {g.salaryGuidance}</p></motion.div>
      <motion.div className="glass-card p-6"><h2 className="font-semibold mb-2">Recommended technologies</h2><motion.div className="flex flex-wrap gap-2">{g.recommendedTechnologies.map((t)=><span key={t} className="rounded-full bg-electric-500/20 px-3 py-1 text-sm">{t}</span>)}</motion.div></motion.div>
      <motion.div className="glass-card p-6"><h2 className="font-semibold mb-2">Skills to learn</h2><ul className="list-disc pl-5 text-sm">{g.skillsToLearn.map((s)=><li key={s}>{s}</li>)}</ul><Link to="/roadmap" className="btn-glow mt-4 inline-block">Open {g.roadmapRecommendation} roadmap</Link></motion.div>
      <motion.div className="glass-card p-6"><h2 className="font-semibold mb-2">AI insights</h2><ul className="space-y-2 text-sm text-slate-300">{g.insights.map((i,idx)=><li key={idx}>• {i}</li>)}</ul></motion.div>
    </motion.div>
  );
}
""")
