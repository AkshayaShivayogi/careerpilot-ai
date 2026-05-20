import { useState } from "react";
import { motion } from "framer-motion";

export default function ExperiencePanel({ technology, experiences, onSubmit }) {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [type, setType] = useState("journey");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ technology, title, story, type });
    setTitle("");
    setStory("");
    setSaving(false);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <form onSubmit={submit} className="premium-card space-y-4 p-5">
        <h3 className="font-semibold">👨‍💻 Share your experience</h3>
        <input
          className="input-field"
          placeholder="Title (e.g. From zero to React job)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="journey">Learning journey</option>
          <option value="roadmap">Roadmap feedback</option>
          <option value="project">Project showcase</option>
          <option value="interview">Interview success</option>
          <option value="tips">Preparation tips</option>
        </select>
        <textarea
          className="input-field min-h-[120px]"
          placeholder="Tell the community about your journey…"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          required
        />
        <button type="submit" className="btn-glow" disabled={saving}>
          {saving ? "Posting…" : "Share experience"}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold">Learner experiences</h3>
        {experiences.map((ex) => (
          <motion.article key={ex._id} className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold text-electric-300">{ex.title}</h4>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs capitalize text-slate-400">
                {ex.type}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {ex.authorName} · {ex.technology}
            </p>
            <p className="mt-3 text-sm text-slate-300">{ex.story}</p>
          </motion.article>
        ))}
        {!experiences.length && <p className="text-slate-500">No experiences shared yet for {technology}.</p>}
      </div>
    </motion.div>
  );
}
