import crypto from "crypto";
import { fetchQuestions, formatQuestionForClient, finalizeSession } from "./interviewEngine.js";
import {
  normalizeSessionQuestions,
  syncAnsweredFlags,
  getCurrentQuestionIndex,
  sessionToClient,
} from "./interviewSessionUtils.js";
import { generateQuestionsByTechnology, resolveFactoryTechnology } from "./interviewQuestionFactory/index.js";
import { scoreAnswerLocally } from "./localInterviewScoring.js";

const STYLE_TYPES = {
  coding: new Set(["coding", "debugging", "output"]),
  behavioral: new Set(["hr", "scenario", "theory"]),
  "system design": new Set(["system_design"]),
  faang: new Set(["coding", "system_design", "scenario", "debugging"]),
  beginner: new Set(["mcq", "theory", "hr"]),
  medium: new Set(["mcq", "theory", "coding", "scenario"]),
  advanced: new Set(["coding", "system_design", "debugging", "optimization"]),
};

function formatSeedQuestion(q, index) {
  return {
    id: `seed-${index}-${crypto.randomBytes(4).toString("hex")}`,
    technology: q.technology || q.stream || "",
    type: q.type || "theory",
    category: q.category || "Fundamentals",
    difficulty: q.difficulty || "medium",
    topic: q.topic || "general",
    companyRelevance: q.companyRelevance || "Industry standard",
    question: q.question,
    options: q.options || [],
    correctAnswer: q.correctAnswer || "",
    expectedAnswer: q.correctAnswer || "",
    explanation: q.explanation || "",
    realWorldExample: q.realWorldExample || "",
    commonMistake: q.commonMistake || "",
    interviewTip: q.interviewTip || "",
    sampleCode: q.codeSnippet || "",
    codeSnippet: q.codeSnippet || "",
    expectedOutput: q.expectedOutput || "",
    timeComplexity: q.timeComplexity || "",
    spaceComplexity: q.spaceComplexity || "",
    whyItMatters: q.whyItMatters || "",
    points: q.points || 10,
    tags: q.tags || [],
    expectedTime: q.expectedTime || 120,
  };
}

export function filterQuestionsByStyles(questions, styles = []) {
  if (!Array.isArray(questions) || !questions.length || !styles?.length) return questions;
  const wanted = new Set();
  for (const s of styles) {
    const key = String(s).toLowerCase();
    const types = STYLE_TYPES[key];
    if (types) types.forEach((t) => wanted.add(t));
  }
  if (!wanted.size) return questions;
  const filtered = questions.filter((q) => wanted.has(String(q.type || "theory").toLowerCase()));
  return filtered.length >= Math.min(5, questions.length) ? filtered : questions;
}

/** Never returns an empty question array */
export async function safeGenerateQuestions({ technology, difficulty = "medium", count = 10, styles = [] }) {
  const tech = String(technology || "React").trim();
  const diff = String(difficulty || "medium").toLowerCase();
  const n = Math.min(25, Math.max(5, Number(count) || 10));
  const sessionSeed = crypto.randomUUID();
  let source = "database";

  try {
    const { pool } = await fetchQuestions(tech, diff, n);
    let questions = normalizeSessionQuestions(
      filterQuestionsByStyles(pool.map(formatQuestionForClient), styles),
      sessionSeed
    );

    if (questions.length < n) {
      const { pool: extra } = await fetchQuestions(tech, diff, n * 2);
      const merged = normalizeSessionQuestions(
        filterQuestionsByStyles(extra.map(formatQuestionForClient), styles),
        sessionSeed
      );
      const seen = new Set(questions.map((q) => q.question.toLowerCase().slice(0, 100)));
      for (const q of merged) {
        const key = q.question.toLowerCase().slice(0, 100);
        if (!seen.has(key)) {
          questions.push({ ...q, orderIndex: questions.length });
          seen.add(key);
        }
        if (questions.length >= n) break;
      }
    }

    if (!questions.length) {
      const canonical = resolveFactoryTechnology(tech) || tech;
      const raw = generateQuestionsByTechnology(canonical);
      if (raw.length) {
        questions = normalizeSessionQuestions(
          filterQuestionsByStyles(raw.map((q, i) => formatSeedQuestion(q, i)), styles),
          sessionSeed
        );
        source = "tech_bank";
      }
    }

    if (!questions.length) {
      const canonical = resolveFactoryTechnology(tech) || tech;
      const one = generateQuestionsByTechnology(canonical).slice(0, 1);
      questions = normalizeSessionQuestions(
        one.length
          ? one.map((q, i) => formatSeedQuestion(q, i))
          : [
              {
                id: `fallback-${sessionSeed}`,
                type: "theory",
                question: `(${canonical}) Describe a ${canonical}-specific production issue you debugged end-to-end.`,
                correctAnswer: "Reproduce, check logs/metrics, isolate root cause, fix, postmortem",
                explanation: `Structured ${canonical} incident response expected in interviews.`,
                difficulty: diff,
                points: 10,
                options: [],
              },
            ],
        sessionSeed
      );
      source = "tech_fallback";
    }

    questions = questions.slice(0, n).map((q, i) => ({
      ...q,
      orderIndex: i,
      answered: false,
    }));

    return { questions, source, sessionSeed };
  } catch (e) {
    console.warn("[interviewSafe] generate fallback", e.message);
    const canonical = resolveFactoryTechnology(tech) || tech;
    const raw = generateQuestionsByTechnology(canonical);
    const questions = normalizeSessionQuestions(
      (raw.length ? raw.slice(0, n) : []).map((q, i) => formatSeedQuestion(q, i)),
      sessionSeed
    );
    return {
      questions: questions.slice(0, n).map((q, i) => ({ ...q, orderIndex: i, answered: false })),
      source: "error_fallback",
      sessionSeed,
    };
  }
}

export function safeNextQuestion(session) {
  if (!session?.questions?.length) {
    return { ok: false, index: -1, question: null, session: null };
  }
  syncAnsweredFlags(session);
  const idx = getCurrentQuestionIndex(session);
  const question = idx >= 0 ? session.questions[idx] : null;
  return {
    ok: Boolean(question),
    index: idx,
    question,
    session: sessionToClient(session),
    progressPct: Math.round(((session.answers?.length || 0) / session.questions.length) * 100),
  };
}

export function safeRestoreSession(doc) {
  if (!doc) return { ok: false, session: null };
  const o = doc?.toObject ? doc.toObject() : { ...doc };
  if (!o.questions?.length) return { ok: false, session: null };
  syncAnsweredFlags(o);
  o.currentQuestionIndex = getCurrentQuestionIndex(o);
  return { ok: true, session: sessionToClient(o) };
}

export function safeScoreCalculation(session) {
  if (!session) return { score: 0, percentage: 0, readiness: "Beginner" };
  try {
    if (session.status !== "completed" && (session.answers?.length || 0) >= (session.questions?.length || 0)) {
      finalizeSession(session);
    }
    return {
      score: session.score ?? session.percentage ?? 0,
      percentage: session.percentage ?? session.score ?? 0,
      readiness: session.readiness || "Beginner",
      correctCount: session.correctCount ?? 0,
      weakTopics: session.weakTopics || [],
      strongTopics: session.strongTopics || [],
    };
  } catch {
    const pct = session.maxPoints
      ? Math.round(((session.answers || []).reduce((s, a) => s + (a.points || 0), 0) / session.maxPoints) * 100)
      : 0;
    return { score: pct, percentage: pct, readiness: "Beginner", correctCount: 0, weakTopics: [], strongTopics: [] };
  }
}

export function safeSubmitFallback(session, questionId, userAnswer) {
  const qMeta = session.questions?.find((q) => String(q.id) === String(questionId));
  if (!qMeta) return null;
  const local = scoreAnswerLocally(qMeta, userAnswer);
  return {
    isCorrect: local.isCorrect,
    score: local.score,
    explanation: local.explanation,
    correctAnswer: local.correctAnswer,
    improvementTip: local.improvementTip,
    aiEvaluation: {
      score: local.score,
      strengths: local.strengths,
      weaknesses: local.weaknesses,
      improvementTips: local.improvementTips,
      idealAnswer: local.idealAnswer,
    },
  };
}

export function buildInterviewAnalytics(sessions = [], scoreHistory = []) {
  const completed = sessions.filter((s) => s.status === "completed" || (s.percentage ?? s.score) > 0);
  const byTech = {};
  completed.forEach((s) => {
    const t = s.technology || "Unknown";
    if (!byTech[t]) byTech[t] = { scores: [], count: 0 };
    byTech[t].scores.push(s.percentage ?? s.score ?? 0);
    byTech[t].count += 1;
  });

  const technologyPerformance = Object.entries(byTech).map(([technology, v]) => ({
    technology,
    sessions: v.count,
    avgScore: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
  }));

  const weakTopics = [
    ...new Set(completed.flatMap((s) => s.weakTopics || [])),
  ].slice(0, 12);

  const accuracy =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, s) => sum + (s.percentage ?? s.score ?? 0), 0) / completed.length
        )
      : 0;

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    accuracy,
    interviewReadiness: accuracy,
    technologyPerformance,
    weakTopics,
    scoreHistory: scoreHistory.slice(0, 30),
    solvedQuestionCount: completed.reduce((n, s) => n + (s.correctCount || 0), 0),
    streak: completed.length,
    recommendations: weakTopics.length
      ? [`🎯 Review: ${weakTopics.slice(0, 3).join(", ")}`, "📚 Schedule a mock interview this week"]
      : ["🚀 Keep practicing — try a harder difficulty", "📈 Mix coding + system design styles"],
  };
}
