# generates Interview.jsx without motion.div typos in wrappers
content = r'''import { useEffect, useState, useRef } from "react";
import api from "../services/api.js";
import { getErrorMessage } from "../utils/httpError.js";

export default function Interview() {
  const [streams, setStreams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(null);
  const [stream, setStream] = useState("React");
  const [difficulty, setDifficulty] = useState("medium");
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get("/interview/streams").then((r) => {
      const list = r.data.streams || [];
      setStreams(list);
      if (list[0]) setStream(list[0]);
    });
    api.get("/interview").then((r) => setSessions(r.data.sessions || []));
  }, []);

  useEffect(() => {
    if (active && active.status === "draft") {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [active]);

  async function startSession() {
    setError("");
    setFeedback(null);
    setSeconds(0);
    try {
      const { data } = await api.post("/interview", { stream, difficulty, count: 10 });
      setActive(data.session);
      setSessions(data.sessions);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to start session"));
    }
  }

  async function submit(questionId, q) {
    setError("");
    try {
      const payload = q.type === "mcq" ? { questionId, selectedOption: selected } : { questionId, answer };
      const { data } = await api.post(`/interview/${active._id}/answer`, payload);
      setActive(data.session);
      setSessions(data.sessions);
      setFeedback(data.result);
      setAnswer("");
      setSelected("");
    } catch (e) {
      setError(getErrorMessage(e, "Submit failed"));
    }
  }

  async function bookmark(questionId) {
    await api.post("/interview/bookmark", { questionId });
  }

  const current = active?.questions?.find((q) => !q.answered);

  return (
    <motion.div className="space-y-6">
      <motion.div className="glass-card p-6">
        <h1 className="font-display text-2xl font-bold">AI Interview Engine</h1>
        <p className="text-sm text-slate-400">100+ questions per stream · instant scoring</p>
        <motion.div className="mt-4 flex flex-wrap gap-3">
          <select className="input-field max-w-[200px]" value={stream} onChange={(e) => setStream(e.target.value)}>
            {streams.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="input-field max-w-[140px]" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy (5 pts)</option>
            <option value="medium">Medium (10 pts)</option>
            <option value="hard">Hard (20 pts)</option>
          </select>
          <button type="button" className="btn-glow" onClick={startSession}>Generate session</button>
          {active && <span className="text-electric-400 text-sm self-center">Timer: {seconds}s</span>}
        </motion.div>
        {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
      </motion.div>

      {active && current && (
        <motion.div className="glass-card p-6">
          <motion.div className="flex justify-between mb-4">
            <h2 className="font-semibold">{active.stream} · {current.type}</h2>
            <span className="text-electric-400">Score: {active.score}% ({active.pointsEarned}/{active.maxPoints})</span>
          </motion.div>
          <p className="text-lg mb-4">{current.question}</p>
          {current.type === "mcq" && (
            <motion.div className="space-y-2">
              {current.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelected(opt)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    selected === opt ? "border-electric-500 bg-electric-500/20" : "border-white/10 hover:border-white/30"
                  } ${feedback && opt === feedback.correctAnswer ? "border-emerald-500 bg-emerald-500/20" : ""}
                  ${feedback && !feedback.isCorrect && selected === opt ? "border-red-500 bg-red-500/20" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          )}
          {current.type !== "mcq" && (
            <textarea className="input-field min-h-[100px] w-full" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer…" />
          )}
          <motion.div className="mt-4 flex gap-2">
            <button type="button" className="btn-glow" onClick={() => submit(current.id, current)}>Submit answer</button>
            <button type="button" className="btn-ghost" onClick={() => bookmark(current.id)}>Bookmark</button>
          </motion.div>
          {feedback && (
            <motion.div className={`mt-4 rounded-xl p-4 text-sm ${feedback.isCorrect ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
              <p className="font-semibold">{feedback.isCorrect ? "Correct" : "Incorrect"}</p>
              <p className="mt-1">{feedback.explanation}</p>
              {!feedback.isCorrect && <p className="mt-1">Expected: {feedback.correctAnswer}</p>}
            </motion.div>
          )}
        </motion.div>
      )}

      {active && !current && (
        <motion.div className="glass-card p-6 text-center">
          <p className="text-emerald-400 font-semibold">Session complete — {active.score}%</p>
          <p className="text-sm text-slate-400 mt-2">Weak topics: {(active.weakTopics || []).join(", ") || "None"}</p>
        </motion.div>
      )}

      <motion.div className="glass-card p-6">
        <h3 className="font-semibold">Session history</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {sessions.map((s) => (
            <li key={s._id} className="flex justify-between border-b border-white/5 py-2">
              <button type="button" className="hover:text-electric-400" onClick={() => { setActive(s); setFeedback(null); }}>{s.stream} ({s.difficulty})</button>
              <span>{s.score}%</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
'''
content = content.replace('<motion.div', '<div').replace('</motion.div>', '</div>')
open(r'C:\projects\CAREERPILOT-AI\src\pages\Interview.jsx', 'w', encoding='utf-8').write(content)
