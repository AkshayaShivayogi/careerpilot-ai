/**
 * Local-first interview scoring — no Gemini required.
 */
import { normalizeAnswer } from "./interviewEngine.js";

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function keywordOverlap(userText, reference) {
  const refWords = [...new Set(tokenize(reference))];
  if (!refWords.length) return 0;
  const user = String(userText || "").toLowerCase();
  const hits = refWords.filter((w) => user.includes(w)).length;
  return hits / refWords.length;
}

function hasCodeSignals(text) {
  return /[{`;]|=>|function|class |def |import |const |let |var |public |#include/.test(String(text || ""));
}

/**
 * Score an answer using embedded session question metadata.
 * @returns {{ isCorrect, score, points, explanation, correctAnswer, improvementTip, strengths, weaknesses, improvementTips }}
 */
export function scoreAnswerLocally(qMeta, userAnswer) {
  const user = String(userAnswer ?? "").trim();
  const expected = String(qMeta?.correctAnswer || qMeta?.expectedAnswer || "").trim();
  const explanation = qMeta?.explanation || "";
  const maxPoints = Number(qMeta?.points) > 0 ? Number(qMeta.points) : 10;
  const qType = qMeta?.type || "theory";

  let isCorrect = false;
  let score = 0;

  if (!user) {
    return buildResult({
      isCorrect: false,
      score: 0,
      points: 0,
      expected,
      explanation,
      qMeta,
      user,
    });
  }

  const userNorm = normalizeAnswer(user);
  const expectedNorm = normalizeAnswer(expected);

  if (expectedNorm && userNorm === expectedNorm) {
    isCorrect = true;
    score = 100;
  } else if (qMeta?.options?.length && expectedNorm) {
    const correctIdx = qMeta.options.findIndex((o) => normalizeAnswer(o) === expectedNorm);
    const userIdx = qMeta.options.findIndex((o) => normalizeAnswer(o) === userNorm);
    if (correctIdx >= 0 && userIdx === correctIdx) {
      isCorrect = true;
      score = 100;
    }
  }

  if (!isCorrect) {
    const overlap = keywordOverlap(user, `${expected} ${explanation} ${qMeta?.question || ""}`);
    const lengthScore = Math.min(35, Math.floor(user.length / 8));
    const codeBonus = hasCodeSignals(user) ? 12 : 0;
    const conceptBonus = Math.round(overlap * 45);
    score = Math.min(95, lengthScore + codeBonus + conceptBonus);
    isCorrect = score >= 65 || (user.length > 40 && overlap >= 0.35);
    if (qType === "mcq" || qType === "output" || qType === "debugging") {
      isCorrect = score >= 100;
    }
  }

  const points = isCorrect
    ? maxPoints
    : Math.max(0, Math.round((score / 100) * maxPoints * 0.4));

  return buildResult({
    isCorrect,
    score,
    points,
    expected,
    explanation,
    qMeta,
    user,
  });
}

function buildResult({ isCorrect, score, points, expected, explanation, qMeta, user }) {
  const topic = qMeta?.topic || qMeta?.category || "this topic";
  const improvementTip = isCorrect
    ? qMeta?.interviewTip || "Strong answer — add a measurable outcome or metric next time."
    : qMeta?.commonMistake ||
      `Expand on ${topic}: include definition, example, and trade-offs (${expected.slice(0, 80)}…).`;

  const strengths = isCorrect
    ? [`Clear understanding of ${topic}`, user.length > 60 ? "Good depth and structure" : "Correct core concept"]
    : score >= 45
      ? ["Partial understanding demonstrated"]
      : [];

  const weaknesses = isCorrect
    ? []
    : [
        `Review ${topic} fundamentals`,
        !hasCodeSignals(user) && (qMeta?.type === "coding" || qMeta?.sampleCode)
          ? "Include code or step-by-step logic"
          : "Add more specific examples",
      ];

  return {
    isCorrect,
    score,
    points,
    explanation: explanation || qMeta?.explanation || "",
    correctAnswer: expected || qMeta?.correctAnswer || "",
    improvementTip,
    strengths,
    weaknesses,
    improvementTips: [improvementTip, ...(weaknesses.slice(0, 2))],
    idealAnswer: expected,
    communicationRating: Math.min(10, Math.round(score / 10)),
    confidenceRating: Math.min(10, Math.round(score / 12) + 2),
  };
}

export function buildSubmitResponse({ session, result, completed }) {
  const nextIndex =
    session.status === "completed"
      ? -1
      : Math.min(session.answers?.length || 0, (session.questions?.length || 1) - 1);

  return {
    success: true,
    score: result.score,
    feedback: result.improvementTip,
    strengths: result.strengths,
    improvements: result.improvementTips,
    nextQuestion: session.questions?.[nextIndex] || null,
    session,
    result: {
      ...result,
      completed,
      currentQuestionIndex: nextIndex,
    },
  };
}
