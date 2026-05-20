import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

export default function ReviewPanel({ technology, reviews, analytics, onSubmit, onHelpful }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [experience, setExperience] = useState("");
  const [improvement, setImprovement] = useState("");
  const [reportOutdated, setReportOutdated] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ technology, rating, comment, difficulty, experience, improvement, reportOutdated });
    setComment("");
    setExperience("");
    setImprovement("");
    setSaving(false);
  }

  const techStats = analytics?.byTechnology?.find((t) => t._id === technology);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-300">
            {techStats?.avgRating ? Number(techStats.avgRating).toFixed(1) : analytics?.averageRating || "—"}
          </p>
          <p className="text-xs text-slate-400">Average rating</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-electric-400">{techStats?.count || 0}</p>
          <p className="text-xs text-slate-400">Reviews</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-violet-300">{analytics?.totalReviews || 0}</p>
          <p className="text-xs text-slate-400">Community total</p>
        </div>
      </div>

      <form onSubmit={submit} className="premium-card space-y-4 p-5">
        <h3 className="font-semibold">⭐ Rate {technology} roadmap</h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
              <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
            </button>
          ))}
        </div>
        <textarea
          className="input-field min-h-[80px]"
          placeholder="Share your learning experience…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <select className="input-field" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input
          className="input-field"
          placeholder="Project experience (optional)"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Suggested improvements (optional)"
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={reportOutdated} onChange={(e) => setReportOutdated(e.target.checked)} />
          Report outdated content
        </label>
        <button type="submit" className="btn-glow" disabled={saving}>
          {saving ? "Saving…" : "Submit review"}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold">💬 Learner reviews</h3>
        {reviews.map((r) => (
          <motion.article key={r._id} className="glass-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{r.authorName}</p>
              <p className="text-amber-300">{"★".repeat(r.rating)}</p>
            </div>
            <p className="mt-2 text-sm text-slate-300">{r.comment}</p>
            {r.experience && <p className="mt-2 text-xs text-slate-500">Project: {r.experience}</p>}
            <button type="button" className="btn-ghost mt-2 text-xs" onClick={() => onHelpful(r._id)}>
              🔥 Helpful ({r.helpfulCount || 0})
            </button>
          </motion.article>
        ))}
        {!reviews.length && <p className="text-slate-500">Be the first to review this roadmap.</p>}
      </div>
    </motion.div>
  );
}
