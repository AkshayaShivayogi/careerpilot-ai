import { InterviewQuestion } from "../models/InterviewQuestion.js";
import {
  TECHNOLOGIES,
  CORE_TECHNOLOGIES,
  resolveStreamNames,
  ensureTechnologyQuestions,
} from "./questionSeed.js";

const POINTS = { easy: 5, medium: 10, hard: 20 };

export function normalizeAnswer(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

export function listTechnologies() {
  return [...CORE_TECHNOLOGIES, ...TECHNOLOGIES.filter((t) => !CORE_TECHNOLOGIES.includes(t))];
}

function streamMatchQuery(technology) {
  const names = resolveStreamNames(technology);
  return {
    $or: names.flatMap((n) => {
      const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`^${escaped}$`, "i");
      return [{ stream: re }, { technology: re }];
    }),
  };
}

export async function fetchQuestions(technology, difficulty, count) {
  const tech = String(technology || "").trim();
  const diff = String(difficulty || "medium").toLowerCase();
  const n = Math.min(25, Math.max(5, Number(count) || 10));

  await ensureTechnologyQuestions(tech);

  const baseQuery = streamMatchQuery(tech);
  const matchDiff = { ...baseQuery, difficulty: diff };

  let pool = await InterviewQuestion.aggregate([{ $match: matchDiff }, { $sample: { size: n } }]);

  if (pool.length < n) {
    const extra = await InterviewQuestion.aggregate([
      { $match: baseQuery },
      { $sample: { size: Math.max(n - pool.length, 1) } },
    ]);
    const ids = new Set(pool.map((p) => String(p._id)));
    for (const q of extra) {
      if (!ids.has(String(q._id))) pool.push(q);
    }
  }

  return { pool: pool.slice(0, n), count: n };
}

export function formatQuestionForClient(q) {
  const id = q._id != null ? String(q._id) : String(q.id || "");
  return {
    id,
    technology: q.technology || q.stream || "",
    type: q.type,
    category: q.category || "Fundamentals",
    difficulty: q.difficulty,
    topic: q.topic || "general",
    companyRelevance: q.companyRelevance || "Industry standard",
    question: q.question,
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: q.correctAnswer || "",
    expectedAnswer: q.correctAnswer || q.expectedAnswer || "",
    explanation: q.explanation || "",
    realWorldExample: q.realWorldExample || "",
    commonMistake: q.commonMistake || "",
    interviewTip: q.interviewTip || "",
    sampleCode: q.codeSnippet || q.sampleCode || "",
    codeSnippet: q.codeSnippet || q.sampleCode || "",
    expectedOutput: q.expectedOutput || "",
    timeComplexity: q.timeComplexity || "",
    spaceComplexity: q.spaceComplexity || "",
    points: q.points || POINTS[q.difficulty] || 10,
    tags: q.tags || [],
    expectedTime: q.expectedTime || 120,
    whyItMatters: q.whyItMatters || "",
  };
}

export function checkAnswer(dbQ, userAnswer) {
  const userAns = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(dbQ.correctAnswer);
  let isCorrect = userAns === correct;

  if (!isCorrect && dbQ.options?.length) {
    const correctIdx = dbQ.options.findIndex((o) => normalizeAnswer(o) === correct);
    const userIdx = dbQ.options.findIndex((o) => normalizeAnswer(o) === userAns);
    if (correctIdx >= 0 && userIdx >= 0) isCorrect = userIdx === correctIdx;
  }

  if (!isCorrect && ["mcq", "output", "debugging"].includes(dbQ.type) === false && userAns.length > 25) {
    const keywords = correct.split(/\s+/).filter((w) => w.length > 4);
    const hits = keywords.filter((k) => userAns.includes(k)).length;
    isCorrect = keywords.length > 0 && hits >= Math.ceil(keywords.length * 0.35);
  }

  return isCorrect;
}

export function buildReadiness(percentage, weakCount) {
  if (percentage >= 85 && weakCount <= 2) return "Industry Ready";
  if (percentage >= 70) return "Advanced";
  if (percentage >= 50) return "Intermediate";
  return "Beginner";
}

export function buildFeedback(session) {
  const tips = [];
  const recommendations = [];
  const pct = session.percentage || 0;

  if (session.weakTopics?.length) {
    tips.push(`Focus practice on: ${session.weakTopics.slice(0, 4).join(", ")}`);
    recommendations.push(`Drill ${session.weakTopics[0]} with timed ${session.difficulty} questions`);
  }
  if (pct < 60) {
    tips.push("Review fundamentals before mock interviews");
    recommendations.push("Re-read core concepts and rebuild one small project");
  } else if (pct >= 80) {
    tips.push("Strong performance — schedule timed mock interviews");
    recommendations.push("Add system design and behavioral rounds");
  }

  tips.push(`Continue ${session.technology} prep at ${session.difficulty} level`);

  const roadmaps = [
    {
      title: `${session.technology} Interview Roadmap`,
      steps: ["Fundamentals", "Practice questions", "Projects", "Mocks", "Review weak topics"],
    },
  ];

  return {
    aiTips: [...new Set(tips)].slice(0, 8),
    recommendations: [...new Set(recommendations)].slice(0, 6),
    roadmapSuggestions: roadmaps,
  };
}

export function buildCharts(session) {
  const byTopic = {};
  const byDiff = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };

  for (const a of session.answers || []) {
    const topic = a.topic || "general";
    if (!byTopic[topic]) byTopic[topic] = { correct: 0, total: 0 };
    byTopic[topic].total += 1;
    if (a.isCorrect) byTopic[topic].correct += 1;
  }

  for (const q of session.questions || []) {
    const d = q.difficulty || "medium";
    if (byDiff[d]) byDiff[d].total += 1;
  }
  for (const a of session.answers || []) {
    const q = session.questions?.find((x) => String(x.id) === String(a.questionId));
    const d = q?.difficulty || "medium";
    if (byDiff[d] && a.isCorrect) byDiff[d].correct += 1;
  }

  const topicPerformance = Object.entries(byTopic).map(([name, v]) => ({
    name,
    score: v.total ? Math.round((v.correct / v.total) * 100) : 0,
  }));

  const difficultyBreakdown = Object.entries(byDiff).map(([name, v]) => ({
    name,
    correct: v.correct,
    missed: Math.max(0, v.total - v.correct),
  }));

  const radar = topicPerformance.slice(0, 8).map((t) => ({ topic: t.name, value: t.score }));

  return {
    topicPerformance,
    difficultyBreakdown,
    radar,
    scoreSummary: [
      { name: "Correct", value: session.correctCount || 0 },
      { name: "Wrong", value: Math.max(0, (session.totalQuestions || 0) - (session.correctCount || 0)) },
    ],
  };
}

export function finalizeSession(session) {
  session.pointsEarned = session.answers.reduce((s, a) => s + (a.points || 0), 0);
  session.correctCount = session.answers.filter((a) => a.isCorrect).length;
  session.totalQuestions = session.questions.length;
  session.percentage = session.maxPoints
    ? Math.round((session.pointsEarned / session.maxPoints) * 100)
    : Math.round((session.correctCount / Math.max(session.totalQuestions, 1)) * 100);
  session.score = session.percentage;
  session.skillConfidence = Math.min(
    100,
    Math.round(session.percentage * 0.85 + (session.correctCount / Math.max(session.totalQuestions, 1)) * 15)
  );
  session.readiness = buildReadiness(session.percentage, session.weakTopics?.length || 0);
  session.strengths = session.strongTopics?.length
    ? session.strongTopics.slice(0, 6).map((t) => `Strong in ${t}`)
    : session.percentage >= 70
      ? ["Solid overall accuracy"]
      : [];
  session.weaknesses = session.weakTopics?.length
    ? session.weakTopics.slice(0, 6).map((t) => `Needs work on ${t}`)
    : session.percentage < 60
      ? ["Fundamentals need reinforcement"]
      : [];
  session.explanations = session.answers.map((a) => a.explanation).filter(Boolean).slice(0, 30);

  const feedback = buildFeedback(session);
  session.aiTips = feedback.aiTips;
  session.recommendations = feedback.recommendations;
  session.roadmapSuggestions = feedback.roadmapSuggestions;
  session.chartsData = buildCharts(session);
  session.status = "completed";
  session.completedAt = new Date();

  return session;
}
