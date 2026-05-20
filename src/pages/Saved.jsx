import { useEffect, useState } from "react";
import { safeApi } from "../services/api.js";
import { SAVED_EMPTY } from "../data/apiFallbacks.js";

export default function Saved() {
  const [data, setData] = useState(SAVED_EMPTY);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await safeApi.get("/saved", {}, { fallback: SAVED_EMPTY });
      if (cancelled) return;
      const payload = result.data?.roadmaps != null ? result.data : { ...SAVED_EMPTY, ...result.data };
      setData(payload);
      setOffline(result.usedFallback);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="glass-card p-8">Loading saved items…</div>;
  }

  const isEmpty =
    !(data.roadmaps?.length || data.interviewSessions?.length || data.resumes?.length || data.bookmarkedQuestions?.length);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Saved library</h1>
      {offline && (
        <p className="text-sm text-amber-300/90">Could not sync saved items — showing your empty library.</p>
      )}
      {isEmpty && (
        <div className="glass-card p-8 text-center">
          <p className="text-slate-400">No saved items yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Save roadmaps, interview sessions, resumes, and bookmarks from other modules.
          </p>
        </div>
      )}
      <div className="glass-card p-6">
        <h2 className="mb-3 text-electric-400">Roadmaps</h2>
        {(data.roadmaps || []).map((r) => (
          <p key={r._id} className="border-b border-white/5 py-1 text-sm">
            {r.title}
          </p>
        ))}
        {!data.roadmaps?.length && <p className="text-sm text-slate-500">None</p>}
      </div>
      <div className="glass-card p-6">
        <h2 className="mb-3 text-electric-400">Interviews</h2>
        {(data.interviewSessions || []).map((s) => (
          <p key={s._id} className="py-1 text-sm">
            {s.stream} — {s.score}%
          </p>
        ))}
        {!data.interviewSessions?.length && <p className="text-sm text-slate-500">None</p>}
      </div>
      <div className="glass-card p-6">
        <h2 className="mb-3 text-electric-400">Resumes</h2>
        {(data.resumes || []).map((r) => (
          <p key={r._id} className="py-1 text-sm">
            {r.fileName}
          </p>
        ))}
        {!data.resumes?.length && <p className="text-sm text-slate-500">None</p>}
      </div>
      <div className="glass-card p-6">
        <h2 className="mb-3 text-electric-400">Bookmarked questions</h2>
        {(data.bookmarkedQuestions || []).map((q) => (
          <p key={q._id} className="border-b border-white/5 py-2 text-sm">
            {q.question?.slice(0, 120)}…
          </p>
        ))}
        {!data.bookmarkedQuestions?.length && <p className="text-sm text-slate-500">None</p>}
      </div>
    </div>
  );
}
