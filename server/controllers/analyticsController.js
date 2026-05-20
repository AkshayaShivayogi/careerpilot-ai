import { syncUserAnalytics } from "../services/analyticsEngine.js";
import { UserAchievement } from "../models/UserAchievement.js";
import { AnalyticsHistory } from "../models/AnalyticsHistory.js";
import { UserProgress } from "../models/UserProgress.js";

export async function getFullAnalytics(req, res, next) {
  try {
    const data = await syncUserAnalytics(req.user._id);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function getAchievements(req, res, next) {
  try {
    const data = await syncUserAnalytics(req.user._id);
    res.json({
      achievements: data.achievements,
      newlyUnlocked: data.newlyUnlocked,
      metrics: {
        unlocked: data.achievements.filter((a) => a.unlocked).length,
        total: data.achievements.length,
        learningStreak: data.metrics.learningStreak,
        dsaSolved: data.metrics.dsaSolved,
      },
      timeline: await UserAchievement.find({ userId: req.user._id })
        .sort({ unlockedAt: -1 })
        .lean(),
    });
  } catch (e) {
    next(e);
  }
}

export async function getProgressDashboard(req, res, next) {
  try {
    const data = await syncUserAnalytics(req.user._id);
    const snapshot = await UserProgress.findOne({ userId: req.user._id }).lean();
    const history = await AnalyticsHistory.find({ userId: req.user._id }).sort({ date: 1 }).limit(30).lean();

    res.json({
      snapshot,
      history,
      ...data,
    });
  } catch (e) {
    next(e);
  }
}
