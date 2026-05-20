import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiFeedbackHistory } from "../models/AiFeedbackHistory.js";

const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 10000;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const POINTS = { easy: 5, medium: 10, hard: 20, faang: 25 };

function isEnabled() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function isGeminiEnabled() {
  return isEnabled();
}

export const isAiConfigured = isGeminiEnabled;

function sanitizeText(input, max = 12000) {
  return String(input || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .slice(0, max);
}

function parseJsonBlock(text) {
  if (!text) return null;
  const raw = String(text).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        /* continue */
      }
    }
    const start = raw.indexOf("[");
    const endArr = raw.lastIndexOf("]");
    if (start >= 0 && endArr > start) {
      try {
        return JSON.parse(raw.slice(start, endArr + 1));
      } catch {
        /* continue */
      }
    }
    const objStart = raw.indexOf("{");
    const objEnd = raw.lastIndexOf("}");
    if (objStart >= 0 && objEnd > objStart) {
      try {
        return JSON.parse(raw.slice(objStart, objEnd + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callGeminiOnce(model, prompt) {
  const result = await Promise.race([
    model.generateContent(sanitizeText(prompt, 16000)),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini request timed out")), TIMEOUT_MS)
    ),
  ]);
  return result?.response?.text?.() || "";
}

async function callGemini(prompt, { kind = "generic", userId = null, temperature = 0.4, saveHistory = true } = {}) {
  if (!isEnabled()) {
    console.warn("[gemini]", kind, "skipped — no API key");
    return { ok: false, fallback: true, message: "Gemini API not configured (GEMINI_API_KEY)" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { temperature, maxOutputTokens: 8192 },
  });

  const maxAttempts = Number(process.env.GEMINI_RETRY_COUNT) || 1;
  let lastRaw = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[gemini] ${kind} attempt ${attempt}/${maxAttempts}`);
      const text = await callGeminiOnce(model, prompt);
      lastRaw = text;
      const data = parseJsonBlock(text);
      if (data == null) {
        console.warn(`[gemini] ${kind} invalid JSON on attempt ${attempt}`);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
          continue;
        }
        return { ok: false, fallback: true, message: "Gemini returned invalid JSON", raw: text.slice(0, 400) };
      }

      if (saveHistory && userId) {
        await AiFeedbackHistory.create({
          userId,
          type: kind,
          model: MODEL,
          inputSummary: sanitizeText(prompt, 300),
          output: data,
        }).catch(() => {});
      }

      console.log(`[gemini] ${kind} success`);
      return { ok: true, data, provider: "gemini" };
    } catch (err) {
      console.error(`[gemini] ${kind} attempt ${attempt} failed:`, err.message);
      if (attempt >= maxAttempts) {
        return { ok: false, fallback: true, message: err.message || "Gemini request failed", raw: lastRaw.slice(0, 400) };
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  return { ok: false, fallback: true, message: "Gemini request failed" };
}

const VALID_TYPES = new Set([
  "mcq",
  "theory",
  "coding",
  "debugging",
  "output",
  "scenario",
  "system_design",
  "behavioral",
]);

function repairRawQuestion(raw) {
  if (!raw || typeof raw !== "object") return null;
  const question = sanitizeText(raw.question, 3000).trim();
  if (question.length < 5) return null;

  let type = String(raw.type || "theory").toLowerCase().replace(/\s+/g, "_");
  if (!VALID_TYPES.has(type)) type = "theory";

  const options = Array.isArray(raw.options)
    ? raw.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 6)
    : [];

  const correctAnswer = sanitizeText(raw.correctAnswer || raw.idealAnswer || raw.answer, 500).trim();
  const idealAnswer = sanitizeText(raw.idealAnswer || raw.correctAnswer || correctAnswer, 1500).trim();

  return {
    type,
    style: raw.style || "technical",
    category: raw.category || "Technical",
    topic: raw.topic || "general",
    difficulty: ["easy", "medium", "hard"].includes(String(raw.difficulty).toLowerCase())
      ? String(raw.difficulty).toLowerCase()
      : "medium",
    companyRelevance: raw.companyRelevance || "Industry standard",
    question,
    options: ["mcq", "output", "debugging"].includes(type) && options.length < 2 ? ["A", "B", "C", "D"] : options,
    correctAnswer: correctAnswer || idealAnswer || "See ideal answer",
    idealAnswer: idealAnswer || correctAnswer,
    explanation: sanitizeText(raw.explanation, 2000),
    codeSnippet: sanitizeText(raw.codeSnippet, 4000),
    timeComplexity: raw.timeComplexity || "",
    spaceComplexity: raw.spaceComplexity || "",
    whyItMatters: raw.whyItMatters || "",
    interviewTip: raw.interviewTip || "",
    expectedTime: Number(raw.expectedTime) || 120,
  };
}

/** Dedupe, validate, assign unique ids — exactly targetCount when possible */
export function normalizeGeminiQuestions(rawList, targetCount, sessionSeed) {
  const seed = sessionSeed || crypto.randomUUID();
  const n = Math.min(20, Math.max(5, Number(targetCount) || 10));
  const arr = Array.isArray(rawList) ? rawList : rawList?.questions ? rawList.questions : [];
  const seenText = new Set();
  const seenIds = new Set();
  const valid = [];

  for (const raw of arr) {
    if (valid.length >= n) break;
    const repaired = repairRawQuestion(raw);
    if (!repaired) continue;

    const textKey = repaired.question.toLowerCase().slice(0, 120);
    if (seenText.has(textKey)) continue;
    seenText.add(textKey);

    const formatted = formatGeminiQuestion(repaired, valid.length, seed);
    if (seenIds.has(formatted.id)) {
      formatted.id = `ai-${seed}-${valid.length}-${crypto.randomBytes(3).toString("hex")}`;
    }
    seenIds.add(formatted.id);
    valid.push(formatted);
  }

  return valid;
}

export function formatGeminiQuestion(q, index = 0, sessionSeed = crypto.randomUUID()) {
  const diff = String(q.difficulty || "medium").toLowerCase();
  const id = `ai-${sessionSeed}-${index}`;
  return {
    id,
    aiGenerated: true,
    type: q.type || "theory",
    category: q.category || "Technical",
    difficulty: diff,
    style: q.style || "technical",
    topic: q.topic || "general",
    companyRelevance: q.companyRelevance || "Industry standard",
    question: q.question,
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: q.correctAnswer || q.idealAnswer || "",
    idealAnswer: q.idealAnswer || q.correctAnswer || "",
    explanation: q.explanation || "",
    codeSnippet: q.codeSnippet || "",
    whyItMatters: q.whyItMatters || "",
    interviewTip: q.interviewTip || "",
    timeComplexity: q.timeComplexity || "",
    spaceComplexity: q.spaceComplexity || "",
    points: POINTS[diff] || POINTS.medium,
    tags: [q.style, q.topic].filter(Boolean),
    expectedTime: Number(q.expectedTime) || 120,
    orderIndex: index,
    answered: false,
  };
}

/** Dynamic interview questions — unique each session */
export async function generateInterviewQuestions(
  technology,
  difficulty,
  count,
  { styles = [], userId = null } = {}
) {
  const n = Math.min(20, Math.max(5, Number(count) || 10));
  const styleList =
    styles.length > 0
      ? styles.join(", ")
      : "technical, coding, behavioral, system design, FAANG-style, debugging, output prediction";

  const sessionSeed = crypto.randomUUID();

  const prompt = `You are a senior FAANG interviewer. Generate exactly ${n} UNIQUE interview questions for ${sanitizeText(technology, 80)}.
Difficulty focus: ${difficulty}
Include mix of styles: ${styleList}
Session seed (must produce different questions than any prior session): ${sessionSeed}
Timestamp: ${Date.now()}

Rules:
- Each question MUST be distinct (no duplicates).
- Each object MUST include a non-empty "question" string.
- Return ONLY a JSON array (no markdown).

JSON array schema:
[{
  "type": "mcq"|"theory"|"coding"|"debugging"|"output"|"scenario"|"system_design"|"behavioral",
  "style": "beginner"|"medium"|"advanced"|"FAANG"|"behavioral"|"system design"|"coding",
  "category": string,
  "topic": string,
  "difficulty": "easy"|"medium"|"hard",
  "companyRelevance": string,
  "question": string,
  "options": string[],
  "correctAnswer": string,
  "explanation": string,
  "idealAnswer": string,
  "codeSnippet": string,
  "timeComplexity": string,
  "spaceComplexity": string,
  "whyItMatters": string,
  "interviewTip": string,
  "expectedTime": number
}]`;

  let result = await callGemini(prompt, {
    kind: "interview_questions",
    userId,
    temperature: 0.65,
    saveHistory: true,
  });

  if (!result.ok) return result;

  let questions = normalizeGeminiQuestions(result.data, n, sessionSeed);

  if (questions.length < n) {
    const retry = await callGemini(
      `${prompt}\n\nYou returned ${questions.length} valid questions. Generate ${n - questions.length} MORE unique questions as a JSON array only.`,
      { kind: "interview_questions_retry", userId, temperature: 0.9, saveHistory: false }
    );
    if (retry.ok) {
      const more = normalizeGeminiQuestions(retry.data, n - questions.length, sessionSeed);
      const seen = new Set(questions.map((q) => q.question.toLowerCase().slice(0, 80)));
      for (const q of more) {
        const key = q.question.toLowerCase().slice(0, 80);
        if (!seen.has(key) && questions.length < n) {
          seen.add(key);
          q.id = `ai-${sessionSeed}-${questions.length}`;
          q.orderIndex = questions.length;
          questions.push(q);
        }
      }
    }
  }

  if (!questions.length) {
    return { ok: false, fallback: true, message: "No valid questions in Gemini response" };
  }

  const minRequired = Math.max(3, Math.floor(n * 0.6));
  if (questions.length < minRequired) {
    console.warn("[gemini] interview_questions partial", { got: questions.length, wanted: n });
    return {
      ok: true,
      questions,
      sessionSeed,
      provider: "gemini",
      partial: true,
      message: `Only ${questions.length}/${n} questions passed validation`,
    };
  }

  return { ok: true, questions, sessionSeed, provider: "gemini" };
}

/** Per-answer Gemini evaluation */
export async function evaluateInterviewAnswer(questionMeta, userAnswer, userId = null) {
  const prompt = `Evaluate this interview answer. Return ONLY valid JSON.
Technology context: ${questionMeta.topic || "general"}
Question type: ${questionMeta.type}
Style: ${questionMeta.style || "technical"}
Difficulty: ${questionMeta.difficulty}

Question:
${sanitizeText(questionMeta.question, 2000)}

Reference answer:
${sanitizeText(questionMeta.correctAnswer || questionMeta.idealAnswer, 1500)}

Candidate answer:
${sanitizeText(userAnswer, 3000)}

JSON schema:
{
  "score": number (0-100),
  "isCorrect": boolean,
  "strengths": string[],
  "weaknesses": string[],
  "improvementTips": string[],
  "idealAnswer": string,
  "communicationRating": number (0-100),
  "confidenceRating": number (0-100),
  "explanation": string,
  "speechAnalysisNote": string (placeholder note for future speech analysis)
}`;

  return callGemini(prompt, { kind: "interview_answer", userId, temperature: 0.3 });
}

export async function analyzeInterviewSession(session, userId = null) {
  const qa = (session.answers || []).map((a, i) => {
    const q =
      session.questions?.find((x) => String(x.id) === String(a.questionId)) || session.questions?.[i];
    return {
      question: q?.question?.slice(0, 200),
      answer: a.answer,
      score: a.aiScore,
      topic: a.topic,
    };
  });

  const prompt = `Generate interview session report. Return ONLY valid JSON.
Technology: ${session.technology}
Difficulty: ${session.difficulty}
Overall: ${session.score}%

Q&A: ${JSON.stringify(qa).slice(0, 7000)}

JSON schema:
{
  "score": number,
  "strengths": string[],
  "weaknesses": string[],
  "confidenceLevel": "low"|"medium"|"high",
  "communicationFeedback": string,
  "technicalTips": string[],
  "readiness": string,
  "reportSummary": string,
  "recommendedFocus": string[]
}`;

  return callGemini(prompt, { kind: "interview", userId, temperature: 0.35 });
}

export const analyzeInterviewWithAI = analyzeInterviewSession;

export async function analyzeResumeWithAI(resumeText, targetRole, profile = {}, userId = null) {
  const prompt = `Expert ATS resume coach. Return ONLY valid JSON.
Target role: ${sanitizeText(targetRole, 120)}
Skills: ${(profile.skills || []).join(", ").slice(0, 400)}

Resume:
${sanitizeText(resumeText, 9000)}

JSON schema:
{
  "atsScore": number,
  "overallScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "missingSkills": string[],
  "missingKeywords": string[],
  "suggestions": string[],
  "keywordOptimization": string[],
  "projectSuggestions": string[],
  "careerSuggestions": string[],
  "interviewReadiness": string,
  "recommendedSkills": string[]
}`;

  return callGemini(prompt, { kind: "resume", userId });
}

export async function generateDynamicPlanner(
  {
    technology,
    difficulty = "medium",
    careerGoal = "Software Engineer",
    durationWeeks = 8,
    targetRole,
    experienceLevel,
    skills = [],
  },
  userId = null
) {
  const tech = sanitizeText(technology, 80);
  const weeks = Math.min(24, Math.max(4, Number(durationWeeks) || 8));
  const monthCount = Math.max(2, Math.ceil(weeks / 4));
  const weekCount = Math.min(weeks, 8);
  const sessionSeed = crypto.randomUUID();

  const prompt = `You are an expert technical career coach. Create a UNIQUE learning planner for "${tech}" ONLY.
This plan MUST differ substantially from plans for Java, DSA, Spring Boot, MERN, or generic stacks.

Session seed: ${sessionSeed}
Timestamp: ${Date.now()}

Learner profile:
- Technology track: ${tech}
- Difficulty: ${difficulty}
- Career goal: ${sanitizeText(careerGoal, 120)}
- Target role: ${sanitizeText(targetRole || careerGoal, 80)}
- Experience: ${experienceLevel || "beginner"}
- Duration: ${weeks} weeks (${monthCount} months)
- Existing skills: ${(skills || []).slice(0, 12).join(", ") || "none listed"}

Requirements:
- ${weekCount} weekly modules with specific ${tech} topics (not generic programming)
- ${monthCount} monthly phases with milestones
- Daily targets tailored to ${tech}
- DSA plan aligned with ${tech} interviews
- Interview prep schedule for ${careerGoal}
- 3-5 portfolio project ideas using ${tech}
- Revision schedule (spaced repetition)

Return ONLY valid JSON (no markdown):
{
  "summary": string,
  "weeklyPlan": [{ "week": number, "title": string, "topics": string[], "goal": string }],
  "monthlyPlan": [{ "month": number, "title": string, "focus": string, "milestones": string[] }],
  "dailyTasks": string[],
  "dsaPlan": string[],
  "interviewSchedule": string[],
  "revisionSchedule": string[],
  "projects": string[]
}`;

  return callGemini(prompt, { kind: "planner", userId, temperature: 0.72 });
}

export async function generatePlannerWithAI(context, userId = null) {
  return generateDynamicPlanner(context, userId);
}

export async function generateRoadmapWithAI(technology, level = "beginner", userId = null) {
  return generateDynamicPlanner(
    { technology, difficulty: level, careerGoal: "Software Engineer", durationWeeks: 8 },
    userId
  );
}

export async function generateDailyTargetsWithAI(context, userId = null) {
  const prompt = `Personalized daily learning targets. Return ONLY valid JSON.
Context: ${JSON.stringify(context).slice(0, 5000)}

JSON schema:
{
  "tasks": [{ "title": string, "category": "roadmap"|"dsa"|"interview"|"revision"|"project"|"practice" }]
}`;

  return callGemini(prompt, { kind: "daily_targets", userId });
}

export async function generateTrendingTechnologies(targetRole = "software engineer", userId = null) {
  const prompt = `Real-world tech market insights for ${sanitizeText(targetRole, 80)}. Return ONLY valid JSON.
JSON schema:
{
  "technologies": [{
    "name": string,
    "category": string,
    "demand": number (0-100),
    "hiringTrend": "High"|"Medium"|"Low",
    "growth": string,
    "salaryLabel": string,
    "difficulty": "Easy"|"Medium"|"Hard",
    "recommendedSkills": string[]
  }]
}`;

  return callGemini(prompt, { kind: "trending", userId, temperature: 0.5 });
}

export async function generateSmartSuggestions(context, userId = null) {
  const prompt = `Career recommendations. Return ONLY valid JSON.
Context: ${JSON.stringify(context).slice(0, 5000)}
JSON schema:
{
  "recommendedTechnologies": [{ "name": string, "reason": string }],
  "nextConcepts": string[],
  "trendingStacks": string[],
  "learningRecommendations": string[]
}`;

  return callGemini(prompt, { kind: "suggestions", userId });
}

export function mergeResumeWithAi(heuristic, aiData) {
  if (!aiData) return heuristic;
  return {
    ...heuristic,
    atsScore: aiData.atsScore ?? heuristic.atsScore,
    overallScore: aiData.overallScore ?? heuristic.overallScore,
    strengths: [...new Set([...(aiData.strengths || []), ...(heuristic.strengths || [])])].slice(0, 10),
    weaknesses: [...new Set([...(aiData.weaknesses || []), ...(heuristic.weaknesses || [])])].slice(0, 10),
    missingSkills: [...new Set([...(aiData.missingSkills || []), ...(heuristic.missingSkills || [])])].slice(0, 14),
    suggestions: [...new Set([...(aiData.suggestions || []), ...(heuristic.suggestions || [])])].slice(0, 12),
    aiSuggestions: aiData.suggestions || [],
    keywordOptimization: aiData.keywordOptimization || aiData.missingKeywords || [],
    projectSuggestions: aiData.projectSuggestions || heuristic.recommendedProjects || [],
    careerSuggestions: aiData.careerSuggestions || [],
    interviewReadiness: aiData.interviewReadiness || "",
    recommendedSkills: [...new Set([...(aiData.recommendedSkills || []), ...(heuristic.recommendedSkills || [])])].slice(0, 14),
    aiPowered: true,
    geminiGenerated: true,
  };
}
