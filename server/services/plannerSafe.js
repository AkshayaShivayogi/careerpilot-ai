import { buildAdvancedPlanner, computePlannerAnalytics, safePlanner } from "./advancedPlannerEngine.js";

export { safePlanner, computePlannerAnalytics, buildAdvancedPlanner };

export function ensurePlannerPlan(meta, rawPlan) {
  const safe = safePlanner(meta);
  const base = safe.plan;
  if (rawPlan?.weekly?.length) {
    return {
      ...base,
      ...rawPlan,
      weekly: rawPlan.weekly?.length ? rawPlan.weekly : base.weekly,
      monthly: rawPlan.monthly?.length ? rawPlan.monthly : base.monthly,
      planId: rawPlan.planId || base.planId,
    };
  }
  return base;
}

export function safeAnalytics(plan, progress) {
  try {
    return computePlannerAnalytics(plan || safePlanner({}).plan, progress || {});
  } catch {
    return computePlannerAnalytics(safePlanner({}).plan, {});
  }
}
