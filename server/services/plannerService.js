import crypto from "crypto";
import { generateDynamicPlanner as callGeminiPlanner } from "./geminiService.js";
import { isGeminiEnhanceEnabled } from "../config/aiMode.js";
import { buildAdvancedPlanner } from "./advancedPlannerEngine.js";

const STATUS_CYCLE = ["in_progress", "upcoming", "locked", "locked"];

function clampWeeks(n) {
  return Math.min(24, Math.max(4, Number(n) || 8));
}

function parseDurationWeeks(duration) {
  if (typeof duration === "number") return clampWeeks(duration);
  const s = String(duration || "").toLowerCase();
  const num = parseInt(s, 10);
  if (s.includes("month")) return clampWeeks((num || 6) * 4);
  return clampWeeks(num || 8);
}

function asStringArray(val, max = 20) {
  if (!Array.isArray(val)) return [];
  return val.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, max);
}

/** Map raw Gemini JSON → UI plan shape (matches Planner.jsx) */
export function normalizePlannerForClient(raw, meta = {}) {
  const technology = meta.technology || "Technology";
  const difficulty = meta.difficulty || "medium";
  const careerGoal = meta.careerGoal || "Software Engineer";
  const durationWeeks = clampWeeks(meta.durationWeeks || 8);
  const fallbackBase = buildFallbackPlanner({ technology, difficulty, careerGoal, durationWeeks });

  if (!raw || typeof raw !== "object") {
    return { ...fallbackBase, geminiGenerated: false, fallback: true };
  }

  const weeklyRaw = raw?.weeklyPlan || raw?.weekly || [];
  const monthlyRaw = raw?.monthlyPlan || raw?.monthly || [];

  const weekly = weeklyRaw.map((w, i) => {
    const fb = fallbackBase.weekly[i] || fallbackBase.weekly[0];
    return {
      ...(fb || {}),
      id: `w${i + 1}`,
      title: String(w.title || fb?.title || `Week ${w.week ?? i + 1}: ${technology}`).slice(0, 120),
      topics: asStringArray(w.topics, 12).length ? asStringArray(w.topics, 12) : fb?.topics || [],
      goal: String(w.goal || w.learningObjective || fb?.goal || "").slice(0, 300),
      status: STATUS_CYCLE[i] || fb?.status || "upcoming",
      days: Array.isArray(w.days) && w.days.length ? w.days : fb?.days || [],
      codingPractice: w.codingPractice || fb?.codingPractice,
      miniProjects: w.miniProjects || fb?.miniProjects,
      interviewPrep: w.interviewPrep || fb?.interviewPrep,
      aiRecommendations: w.aiRecommendations || fb?.aiRecommendations,
      completionPct: w.completionPct ?? fb?.completionPct ?? 0,
      estimatedHours: w.estimatedHours ?? fb?.estimatedHours,
    };
  });

  const monthly = monthlyRaw.map((m, i) => {
    const fb = fallbackBase.monthly[i] || fallbackBase.monthly[0];
    return {
      ...(fb || {}),
      id: `m${i + 1}`,
      title: String(m.title || fb?.title || `Month ${m.month ?? i + 1}`).slice(0, 120),
      focus: String(m.focus || fb?.focus || "").slice(0, 300),
      milestones: asStringArray(m.milestones, 10).length
        ? asStringArray(m.milestones, 10)
        : fb?.milestones || [],
      status: i === 0 ? "in_progress" : "upcoming",
    };
  });

  const dailyTargets = asStringArray(raw?.dailyTasks || raw?.dailyTargets, 10);
  const projects = asStringArray(raw?.projects || raw?.projectSuggestions, 8);
  const interviewPath = asStringArray(raw?.interviewSchedule || raw?.interviewPrep, 10);
  const revisionSchedule = asStringArray(raw?.revisionSchedule, 10);
  const dsaPlan = asStringArray(raw?.dsaPlan, 10);

  return {
    name: technology,
    technology,
    difficulty,
    careerGoal,
    durationWeeks,
    category: meta.category || "general",
    geminiGenerated: Boolean(meta.geminiGenerated),
    fallback: Boolean(meta.fallback),
    planId: meta.planId || crypto.randomUUID(),
    summary: String(raw?.summary || "").slice(0, 500),
    weekly: weekly.length ? weekly : fallbackBase.weekly,
    monthly: monthly.length ? monthly : fallbackBase.monthly,
    dailyTargets: dailyTargets.length ? dailyTargets : fallbackBase.dailyTargets,
    projects: projects.length ? projects : fallbackBase.projects,
    interviewPath: interviewPath.length ? interviewPath : fallbackBase.interviewPath,
    revisionSchedule: revisionSchedule.length ? revisionSchedule : fallbackBase.revisionSchedule,
    dsaPlan: dsaPlan.length ? dsaPlan : fallbackBase.dsaPlan,
    aiTips: asStringArray(raw?.aiTips, 8).length ? asStringArray(raw?.aiTips, 8) : fallbackBase.aiTips,
  };
}

/** Technology-aware advanced offline planner */
export function buildFallbackPlanner(meta = {}) {
  return buildAdvancedPlanner({
    technology: meta.technology || "React",
    difficulty: meta.difficulty || "medium",
    careerGoal: meta.careerGoal || "Software Engineer",
    durationWeeks: meta.durationWeeks || 8,
    weakTopics: meta.weakTopics || [],
    studyHoursPerWeek: meta.studyHoursPerWeek,
  });
}

export async function generatePlannerPlan(options, userId = null) {
  const technology = String(options.technology || "React").trim();
  const difficulty = String(options.difficulty || "medium").toLowerCase();
  const careerGoal = String(options.careerGoal || options.targetRole || "Software Engineer").trim();
  const durationWeeks = parseDurationWeeks(options.durationWeeks ?? options.duration);

  const meta = { technology, difficulty, careerGoal, durationWeeks };

  if (!technology) {
    return { ok: false, message: "Technology is required", plan: buildFallbackPlanner(meta) };
  }

  const staticPlan = buildFallbackPlanner(meta);

  if (!isGeminiEnhanceEnabled()) {
    return {
      ok: true,
      plan: staticPlan,
      geminiGenerated: false,
      fallback: true,
      static: true,
      message: "Static roadmap (set GEMINI_ENHANCE=true for AI personalization)",
    };
  }

  try {
    const ai = await callGeminiPlanner(
      {
        technology,
        difficulty,
        careerGoal,
        durationWeeks,
        targetRole: options.targetRole,
        experienceLevel: options.experienceLevel,
        skills: options.skills,
      },
      userId
    );

    if (ai.ok && ai.data) {
      const plan = normalizePlannerForClient(ai.data, {
        ...meta,
        geminiGenerated: true,
        fallback: false,
      });
      if (plan?.weekly?.length) {
        return { ok: true, plan, geminiGenerated: true, provider: "gemini" };
      }
    }
  } catch (e) {
    console.warn("[planner] Gemini enhance failed:", e.message);
  }

  return {
    ok: true,
    plan: staticPlan,
    geminiGenerated: false,
    fallback: true,
    message: "Using static roadmap — Gemini enhance unavailable",
  };
}
