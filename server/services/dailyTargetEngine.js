import { buildSmartDailyTargets } from "./advancedDailyTargetEngine.js";

export { todayKey, calcPercent } from "./advancedDailyTargetEngine.js";

/** Local-first smart daily targets — no Gemini required */
export async function generateDailyTargets(user, technology, options = {}) {
  return buildSmartDailyTargets(user, technology, options);
}
