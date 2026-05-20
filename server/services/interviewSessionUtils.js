import crypto from "crypto";

/** Stable string compare for question / answer ids */
export function sameQuestionId(a, b) {
  if (a == null || b == null) return false;
  return String(a).trim() === String(b).trim();
}

export function findQuestionInSession(session, questionId) {
  const id = String(questionId ?? "").trim();
  if (!id || !Array.isArray(session?.questions)) return null;

  let found = session.questions.find((q) => sameQuestionId(q?.id, id));
  if (found) return found;

  found = session.questions.find((q) => sameQuestionId(q?._id, id));
  if (found) return found;

  const idx = session.questions.findIndex((_, i) => sameQuestionId(`q-${i}`, id));
  if (idx >= 0) return session.questions[idx];

  return null;
}

export function findQuestionIndex(session, questionId) {
  const id = String(questionId ?? "").trim();
  if (!id || !Array.isArray(session?.questions)) return -1;

  let idx = session.questions.findIndex((q) => sameQuestionId(q?.id, id));
  if (idx >= 0) return idx;

  idx = session.questions.findIndex((q) => sameQuestionId(q?._id, id));
  return idx;
}

/** Ensure every question has a stable unique id and orderIndex */
export function normalizeSessionQuestions(questions, sessionSeed = crypto.randomUUID()) {
  if (!Array.isArray(questions)) return [];

  const seenIds = new Set();
  const seenText = new Set();
  const out = [];

  for (let i = 0; i < questions.length; i++) {
    const raw = questions[i];
    if (!raw || typeof raw !== "object") continue;

    const questionText = String(raw.question ?? "").trim();
    if (questionText.length < 5) continue;

    const textKey = questionText.toLowerCase().slice(0, 120);
    if (seenText.has(textKey)) continue;
    seenText.add(textKey);

    let id = raw.id != null ? String(raw.id).trim() : "";
    if (!id || seenIds.has(id)) {
      id = raw.aiGenerated
        ? `ai-${sessionSeed}-${out.length}`
        : `q-${sessionSeed}-${out.length}`;
    }
    seenIds.add(id);

    out.push({
      ...raw,
      id,
      orderIndex: out.length,
      question: questionText,
      answered: Boolean(raw.answered),
      options: Array.isArray(raw.options) ? raw.options : [],
      points: Number(raw.points) > 0 ? Number(raw.points) : 10,
    });
  }

  return out;
}

/** Sync answered flags from answers[] — source of truth for navigation */
export function syncAnsweredFlags(session) {
  if (!session?.questions?.length) return session;

  const answeredIds = new Set((session.answers || []).map((a) => String(a.questionId)));

  session.questions = session.questions.map((q, idx) => {
    const id = q.id != null ? String(q.id) : `q-${idx}`;
    const answered = answeredIds.has(id) || answeredIds.has(String(q._id));
    return {
      ...q,
      id,
      orderIndex: typeof q.orderIndex === "number" ? q.orderIndex : idx,
      answered,
      locked: answered ? true : Boolean(q.locked),
    };
  });

  return session;
}

export function getCurrentQuestionIndex(session) {
  if (!session || session.status === "completed") return -1;
  const total = session.questions?.length || 0;
  const answered = session.answers?.length || 0;
  if (total === 0) return -1;
  if (answered >= total) return -1;
  return answered;
}

export function sessionToClient(doc) {
  const o = doc?.toObject ? doc.toObject() : { ...doc };
  o.id = String(o._id || o.id);
  syncAnsweredFlags(o);
  o.currentQuestionIndex = getCurrentQuestionIndex(o);
  o.answeredCount = o.answers?.length || 0;
  o.totalQuestions = o.questions?.length || o.totalQuestions || 0;
  return o;
}
