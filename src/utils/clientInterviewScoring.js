/** Client-side scoring for fully offline local interview sessions */

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

export function scoreAnswerOnClient(qMeta, userAnswer) {
  const user = String(userAnswer ?? "").trim();
  const expected = String(qMeta?.correctAnswer || qMeta?.expectedAnswer || "").trim();
  const maxPoints = Number(qMeta?.points) > 0 ? Number(qMeta.points) : 10;

  if (!user) {
    return { isCorrect: false, score: 0, points: 0, completed: false };
  }

  let isCorrect = false;
  let score = 0;
  const userNorm = normalize(user);
  const expectedNorm = normalize(expected);

  if (expectedNorm && userNorm === expectedNorm) {
    isCorrect = true;
    score = 100;
  } else if (qMeta?.options?.length && expectedNorm) {
    const correctIdx = qMeta.options.findIndex((o) => normalize(o) === expectedNorm);
    const userIdx = qMeta.options.findIndex((o) => normalize(o) === userNorm);
    if (correctIdx >= 0 && userIdx === correctIdx) {
      isCorrect = true;
      score = 100;
    }
  }

  if (!isCorrect) {
    const refWords = [...new Set(tokenize(`${expected} ${qMeta?.explanation || ""}`))];
    const hits = refWords.filter((w) => user.toLowerCase().includes(w)).length;
    const overlap = refWords.length ? hits / refWords.length : 0;
    score = Math.min(92, Math.floor(user.length / 6) + Math.round(overlap * 50));
    isCorrect = score >= 62 || (user.length > 45 && overlap >= 0.3);
  }

  const points = isCorrect ? maxPoints : Math.round((score / 100) * maxPoints * 0.35);

  return {
    isCorrect,
    score,
    points,
    explanation: qMeta?.explanation || "",
    correctAnswer: expected,
    improvementTip: isCorrect
      ? qMeta?.interviewTip || "Good answer."
      : qMeta?.commonMistake || "Add examples, trade-offs, and structure.",
    strengths: isCorrect ? ["Demonstrated core concept"] : [],
    weaknesses: isCorrect ? [] : ["Needs more depth"],
    improvementTips: [isCorrect ? "Keep practicing timed mocks" : "Review the ideal answer pattern"],
    idealAnswer: expected,
    communicationRating: Math.min(10, Math.round(score / 10)),
    confidenceRating: Math.min(10, Math.round(score / 12) + 1),
  };
}

export function applyLocalSubmit(session, questionId, userAnswer) {
  if (!session?.questions?.length) return null;

  const qMeta = session.questions.find((q) => String(q.id) === String(questionId));
  if (!qMeta) return null;

  const existing = (session.answers || []).find((a) => String(a.questionId) === String(questionId));
  if (existing) {
    return { session, result: existing, alreadyAnswered: true };
  }

  const scored = scoreAnswerOnClient(qMeta, userAnswer);
  const answers = [...(session.answers || [])];
  answers.push({
    questionId: String(qMeta.id),
    answer: userAnswer,
    isCorrect: scored.isCorrect,
    points: scored.points,
    correctAnswer: scored.correctAnswer,
    explanation: scored.explanation,
    improvementTip: scored.improvementTip,
    topic: qMeta.topic || "general",
    aiScore: scored.score,
  });

  const questions = session.questions.map((q) =>
    String(q.id) === String(questionId)
      ? { ...q, answered: true, isCorrect: scored.isCorrect, userAnswer, locked: true }
      : q
  );

  const pointsEarned = answers.reduce((s, a) => s + (a.points || 0), 0);
  const maxPoints = questions.reduce((s, q) => s + (q.points || 10), 0);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const completed = answers.length >= questions.length;
  const percentage = maxPoints ? Math.round((pointsEarned / maxPoints) * 100) : 0;

  const nextSession = {
    ...session,
    questions,
    answers,
    pointsEarned,
    maxPoints,
    correctCount,
    percentage,
    score: percentage,
    answeredCount: answers.length,
    totalQuestions: questions.length,
    status: completed ? "completed" : "active",
    currentQuestionIndex: completed ? -1 : answers.length,
  };

  return {
    session: nextSession,
    alreadyAnswered: false,
    result: {
      ...scored,
      completed,
      currentQuestionIndex: nextSession.currentQuestionIndex,
    },
  };
}
