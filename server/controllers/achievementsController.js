import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_TIERS } from "../data/achievementDefinitions.js";
import { gatherMetrics, syncUserAnalytics } from "../services/analyticsEngine.js";
import { unlockAchievementsCheck, ensureLearningStats, levelFromXp } from "../services/careerEcosystemService.js";
import { User } from "../models/User.js";
import { DailyActivity } from "../models/DailyActivity.js";

export async function listAchievements(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    const metrics = user ? await gatherMetrics(user) : {};
    const analytics = await syncUserAnalytics(req.user._id);
    const stats = await ensureLearningStats(req.user._id);

    const activities = await DailyActivity.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const timeline = activities.flatMap((d) =>
      (d.activities || []).map((a) => ({
        date: d.date,
        type: a.type,
        message: a.message,
        at: a.at,
      }))
    );

    res.json({
      achievements: analytics.achievements,
      tiers: ACHIEVEMENT_TIERS,
      definitions: ACHIEVEMENT_DEFINITIONS.length,
      metrics,
      xp: stats.xp,
      level: stats.level || levelFromXp(stats.xp),
      xpToNext: 500 - (stats.xp % 500),
      timeline: timeline.slice(0, 40),
    });
  } catch (e) {
    next(e);
  }
}

export async function unlockCheck(req, res, next) {
  try {
    const result = await unlockAchievementsCheck(req.user._id);
    res.json({
      unlocked: result.unlocked,
      achievements: result.achievements,
      stats: result.stats,
    });
  } catch (e) {
    next(e);
  }
}
