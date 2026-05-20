/** Client-side interview failsafes — never blank UI */

export function safeInterviewState(session) {
  if (!session || typeof session !== "object") {
    return {
      ok: false,
      status: "idle",
      answeredCount: 0,
      totalQuestions: 0,
      currentQuestionIndex: -1,
      progressPct: 0,
    };
  }
  const total = session.questions?.length || session.totalQuestions || 0;
  const answered = session.answers?.length ?? session.answeredCount ?? 0;
  const idx =
    session.status === "completed"
      ? -1
      : typeof session.currentQuestionIndex === "number" && session.currentQuestionIndex >= 0
        ? session.currentQuestionIndex
        : answered < total
          ? answered
          : -1;
  return {
    ok: total > 0,
    status: session.status || "active",
    answeredCount: answered,
    totalQuestions: total,
    currentQuestionIndex: idx,
    progressPct: total ? Math.round((answered / total) * 100) : 0,
    score: session.score ?? session.percentage ?? 0,
  };
}

export function safeQuestionRender(session) {
  const state = safeInterviewState(session);
  if (!state.ok || state.status === "completed" || state.currentQuestionIndex < 0) {
    return null;
  }
  const q =
    session.questions?.[state.currentQuestionIndex] ||
    session.questions?.find((item) => !item.answered) ||
    session.questions?.[state.answeredCount];
  if (!q?.question) return null;
  return {
    ...q,
    id: q.id || q._id || `q-${state.currentQuestionIndex}`,
    options: Array.isArray(q.options) ? q.options : [],
    question: String(q.question),
  };
}

export function safeProgressTracking(session) {
  const state = safeInterviewState(session);
  return {
    ...state,
    weakTopics: session?.weakTopics || [],
    strongTopics: session?.strongTopics || [],
    pointsEarned: session?.pointsEarned || 0,
    maxPoints: session?.maxPoints || 0,
  };
}

export function safeSessionRestore(cached) {
  if (!cached?.questions?.length) return null;
  return {
    ...cached,
    id: cached.id || cached._id,
    questions: cached.questions.filter((q) => q?.question),
    answers: Array.isArray(cached.answers) ? cached.answers : [],
  };
}

export function safeSubmitFallbackMessage(err) {
  return err?.message || "Scored locally — your progress is saved in this browser.";
}
