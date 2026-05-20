import { getLiveProgress, updateProgress, unlockAchievementsCheck } from "../services/careerEcosystemService.js";

export async function getLive(req, res, next) {
  try {
    const live = await getLiveProgress(req.user._id);
    res.json({ live });
  } catch (e) {
    next(e);
  }
}

export async function postUpdate(req, res, next) {
  try {
    const result = await updateProgress(req.user._id, req.body || {});
    res.json({
      ok: true,
      live: result?.live,
      achievementsUnlocked: result?.analytics?.newlyUnlocked?.length || 0,
    });
  } catch (e) {
    next(e);
  }
}

export async function postAnalyticsUpdate(req, res, next) {
  try {
    const result = await unlockAchievementsCheck(req.user._id);
    res.json({
      ok: true,
      achievements: result.achievements,
      unlocked: result.unlocked,
      stats: result.stats,
    });
  } catch (e) {
    next(e);
  }
}
