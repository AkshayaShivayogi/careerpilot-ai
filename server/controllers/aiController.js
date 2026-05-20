import {
  analyzeResumeWithAI,
  analyzeInterviewWithAI,
  generateRoadmapWithAI,
  generateDailyTargetsWithAI,
  generateTrendingTechnologies,
  generateSmartSuggestions,
  generateInterviewQuestions,
  formatGeminiQuestion,
  evaluateInterviewAnswer,
  isAiConfigured,
  isGeminiEnabled,
} from "../services/geminiService.js";
import { generatePlannerPlan } from "../services/plannerService.js";
import { extractTextFromFile } from "../services/resumeAnalyzer.js";
import { InterviewSession } from "../models/InterviewSession.js";
import { AiFeedbackHistory } from "../models/AiFeedbackHistory.js";
import { gatherMetrics } from "../services/analyticsEngine.js";

export async function getAiStatus(_req, res) {
  res.json({
    configured: isAiConfigured(),
    geminiEnabled: isGeminiEnabled(),
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    provider: "gemini",
  });
}

export async function aiResumeAnalyze(req, res, next) {
  try {
    const text = sanitizeBodyText(req.body.text);
    if (!text) return res.status(400).json({ success: false, message: "Resume text required" });
    const targetRole = String(req.body.targetRole || req.user.targetRole || "software engineer");
    const result = await analyzeResumeWithAI(text, targetRole, req.user, req.user._id);
    if (!result.ok) {
      return res.status(503).json({ success: false, message: result.message, fallback: true });
    }
    res.json({ success: true, analysis: result.data, cached: result.cached });
  } catch (e) {
    next(e);
  }
}

export async function aiInterviewFeedback(req, res, next) {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    const result = await analyzeInterviewWithAI(session, req.user._id);
    if (!result.ok) {
      return res.status(503).json({ success: false, message: result.message, fallback: true });
    }
    session.aiFeedback = result.data;
    session.strengths = result.data.strengths || session.strengths;
    session.weaknesses = result.data.weaknesses || session.weaknesses;
    session.readiness = result.data.readiness || session.readiness;
    await session.save();
    res.json({ success: true, feedback: result.data, session });
  } catch (e) {
    next(e);
  }
}

export async function aiRoadmap(req, res, next) {
  try {
    const technology = String(req.body.technology || "").trim();
    if (!technology) return res.status(400).json({ success: false, message: "Technology required" });
    const level = req.body.level || req.user.experienceLevel || "beginner";
    const result = await generateRoadmapWithAI(technology, level, req.user._id);
    if (!result.ok) {
      return res.status(503).json({ success: false, message: result.message, fallback: true });
    }
    res.json({ success: true, roadmap: result.data });
  } catch (e) {
    next(e);
  }
}

export async function aiDailyTargets(req, res, next) {
  try {
    const metrics = await gatherMetrics(req.user);
    const context = {
      technology: req.body.technology || "React",
      weakTopics: metrics.weakTopics,
      roadmapProgress: metrics.roadmapProgressAvg,
      interviewAvg: metrics.interviewAvg,
      incompleteDsa: metrics.topics?.filter((t) => t.progress < 50).map((t) => t.name).slice(0, 5),
    };
    const result = await generateDailyTargetsWithAI(context, req.user._id);
    if (!result.ok) {
      return res.status(503).json({ success: false, message: result.message, fallback: true });
    }
    res.json({ success: true, tasks: result.data.tasks || [] });
  } catch (e) {
    next(e);
  }
}

export async function aiSuggestions(req, res, next) {
  try {
    const metrics = await gatherMetrics(req.user);
    const result = await generateSmartSuggestions(
      {
        targetRole: req.user.targetRole,
        skills: req.user.skills,
        strongestTopic: metrics.strongestTopic,
        weakestTopic: metrics.weakestTopic,
        dsaMastery: metrics.dsaMastery,
      },
      req.user._id
    );
    if (!result.ok) {
      return res.status(503).json({ success: false, message: result.message, fallback: true });
    }
    res.json({ success: true, suggestions: result.data });
  } catch (e) {
    next(e);
  }
}

export async function aiPlanner(req, res, next) {
  try {
    const technology = String(req.body.technology || "React").trim();
    const result = await generatePlannerPlan(
      {
        technology,
        difficulty: req.body.difficulty || req.user.experienceLevel || "medium",
        careerGoal: req.body.careerGoal || req.user.targetRole,
        durationWeeks: req.body.durationWeeks || req.body.duration || 8,
        targetRole: req.user.targetRole,
        experienceLevel: req.user.experienceLevel,
        skills: req.user.skills,
      },
      req.user._id
    );
    res.json({
      success: true,
      plan: result.plan,
      geminiGenerated: result.geminiGenerated,
      fallback: result.fallback,
      message: result.message,
    });
  } catch (e) {
    next(e);
  }
}

export async function aiTrending(req, res, next) {
  try {
    const targetRole = req.user.targetRole || "software engineer";
    const result = await generateTrendingTechnologies(targetRole, req.user._id);
    if (!result.ok) {
      return res.status(503).json({ success: false, message: result.message, fallback: true });
    }
    res.json({ success: true, data: result.data, geminiGenerated: true });
  } catch (e) {
    next(e);
  }
}

export async function aiInterviewGenerate(req, res, next) {
  try {
    const technology = String(req.body.technology || "").trim();
    const difficulty = String(req.body.difficulty || "medium");
    const count = Number(req.body.count) || 10;
    const styles = Array.isArray(req.body.styles) ? req.body.styles : [];
    if (!technology) return res.status(400).json({ success: false, message: "Technology required" });
    const result = await generateInterviewQuestions(technology, difficulty, count, {
      styles,
      userId: req.user._id,
    });
    if (!result.ok) {
      return res.status(503).json({ success: false, message: result.message, fallback: true });
    }
    res.json({
      success: true,
      questions: result.questions.map((q, i) => formatGeminiQuestion(q, i)),
      geminiGenerated: true,
    });
  } catch (e) {
    next(e);
  }
}

export async function aiInterviewEvaluate(req, res, next) {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: "question and answer required" });
    }
    const result = await evaluateInterviewAnswer(question, answer, req.user._id);
    if (!result.ok) {
      return res.status(503).json({ success: false, message: result.message, fallback: true });
    }
    res.json({ success: true, evaluation: result.data, geminiGenerated: true });
  } catch (e) {
    next(e);
  }
}

export async function aiHistory(req, res) {
  const items = await AiFeedbackHistory.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  res.json({ history: items });
}

function sanitizeBodyText(text) {
  return String(text || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .slice(0, 12000);
}
