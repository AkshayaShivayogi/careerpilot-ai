/**
 * Client-side interview bank — uses isolated technology-specific datasets (same as server factory).
 */
import {
  generateQuestionsByTechnology,
  resolveFactoryTechnology,
  listFactoryTechnologies,
} from "../../server/services/interviewQuestionFactory/index.js";

export const SUPPORTED_TECHNOLOGIES = listFactoryTechnologies();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getLocalQuestionBank(technology) {
  const canonical = resolveFactoryTechnology(technology) || String(technology || "React").trim();
  return generateQuestionsByTechnology(canonical);
}

export function getLocalQuestions(technology, difficulty, count = 10) {
  const canonical = resolveFactoryTechnology(technology) || String(technology || "React").trim();
  const n = Math.min(25, Math.max(5, Number(count) || 10));
  const diff = String(difficulty || "medium").toLowerCase();
  const bank = getLocalQuestionBank(canonical);
  const matched = bank.filter((q) => String(q.difficulty || "medium").toLowerCase() === diff);
  const pool = matched.length >= n ? matched : bank;
  const slug = canonical.toLowerCase().replace(/\s+/g, "-");
  return shuffle(pool)
    .slice(0, n)
    .map((q, i) => ({
      ...q,
      id: `local-${slug}-${diff}-${i}-${(q.questionHash || i).toString().slice(0, 6)}`,
      technology: canonical,
    }));
}

export function buildLocalInterviewSession(technology, difficulty, count = 10) {
  const canonical = resolveFactoryTechnology(technology) || String(technology || "React").trim();
  const questions = getLocalQuestions(canonical, difficulty, count);
  const sessionId = `local-${Date.now()}`;
  const maxPoints = questions.reduce((s, q) => s + (q.points || 10), 0);
  return {
    session: {
      id: sessionId,
      _id: sessionId,
      technology: canonical,
      difficulty: String(difficulty || "medium").toLowerCase(),
      status: "active",
      questions,
      answers: [],
      answeredCount: 0,
      totalQuestions: questions.length,
      maxPoints,
      currentQuestionIndex: 0,
      localFallback: true,
      aiGenerated: false,
      geminiGenerated: false,
      questionSource: "tech_bank",
    },
    geminiGenerated: false,
    localFallback: true,
  };
}

export { generateQuestionsByTechnology, resolveFactoryTechnology };
export { SUPPORTED_TECHNOLOGIES as REQUIRED_TECHS };
