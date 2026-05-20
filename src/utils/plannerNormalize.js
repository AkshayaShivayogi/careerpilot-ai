import { buildAdvancedPlanner } from "./advancedPlanner.js";
import { applyProgressToPlan } from "./plannerProgressStore.js";

/** Merge API/Gemini plans with advanced day structure — never return empty weekly */
export function normalizePlan(raw, { technology, difficulty, careerGoal, durationWeeks }, progress) {
  const fallback = buildAdvancedPlanner({
    technology,
    difficulty,
    careerGoal,
    durationWeeks,
  });

  const base = raw && typeof raw === "object" ? raw : {};
  const weeklySrc = Array.isArray(base.weekly) && base.weekly.length ? base.weekly : fallback.weekly;

  const weekly = weeklySrc.map((w, i) => {
    const fb = fallback.weekly[i] || fallback.weekly[0];
    return {
      ...fb,
      ...w,
      id: w.id || fb?.id || `w${i + 1}`,
      title: w.title || fb?.title || `Week ${i + 1}`,
      days: w.days?.length ? w.days : fb?.days || [],
      topics: w.topics?.length ? w.topics : fb?.topics || [],
      goal: w.goal || w.learningObjective || fb?.goal || "",
      status: w.status || fb?.status || (i === 0 ? "in_progress" : "upcoming"),
      codingPractice: w.codingPractice || fb?.codingPractice,
      miniProjects: w.miniProjects || fb?.miniProjects,
      interviewPrep: w.interviewPrep || fb?.interviewPrep,
      aiRecommendations: w.aiRecommendations || fb?.aiRecommendations,
    };
  });

  const monthly =
    Array.isArray(base.monthly) && base.monthly.length
      ? base.monthly.map((m, i) => ({
          ...(fallback.monthly[i] || {}),
          ...m,
          id: m.id || `m${i + 1}`,
        }))
      : fallback.monthly;

  const merged = {
    ...fallback,
    ...base,
    technology: base.technology || technology,
    difficulty: base.difficulty || difficulty,
    careerGoal: base.careerGoal || careerGoal,
    durationWeeks: base.durationWeeks || durationWeeks,
    planId: base.planId || fallback.planId,
    weekly,
    monthly,
    dailyTargets: base.dailyTargets?.length ? base.dailyTargets : fallback.dailyTargets,
    projects: base.projects?.length ? base.projects : fallback.projects,
    interviewPath: base.interviewPath?.length ? base.interviewPath : fallback.interviewPath,
    revisionSchedule: base.revisionSchedule?.length
      ? base.revisionSchedule
      : fallback.revisionSchedule,
    dsaPlan: base.dsaPlan?.length ? base.dsaPlan : fallback.dsaPlan,
    aiTips: base.aiTips?.length ? base.aiTips : fallback.aiTips,
    summary: base.summary || fallback.summary,
  };

  return progress ? applyProgressToPlan(merged, progress) : merged;
}
