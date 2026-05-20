import { User } from "../models/User.js";
import { InterviewSession } from "../models/InterviewSession.js";
import { ResumeAnalysis } from "../models/ResumeAnalysis.js";
import { RoadmapProgress } from "../models/RoadmapProgress.js";
import { DailyTarget } from "../models/DailyTarget.js";
import { RoadmapReview } from "../models/RoadmapReview.js";
import { UserAchievement } from "../models/UserAchievement.js";
import { UserProgress } from "../models/UserProgress.js";
import { AnalyticsHistory } from "../models/AnalyticsHistory.js";
import { DailyActivity } from "../models/DailyActivity.js";
import { ACHIEVEMENT_DEFINITIONS } from "../data/achievementDefinitions.js";
import { ensureUserDsaTopics, formatTopicsForClient } from "../data/dsaTopics.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export async function gatherMetrics(user) {
  ensureUserDsaTopics(user);
  const topics = formatTopicsForClient(user.dsaProgress.topics);

  const [interviews, resumes, roadmapRows, dailyTargets, reviews] = await Promise.all([
    InterviewSession.find({ userId: user._id, status: "completed" }).sort({ createdAt: -1 }).limit(50).lean(),
    ResumeAnalysis.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    RoadmapProgress.find({ userId: user._id }).lean(),
    DailyTarget.find({ userId: user._id }).sort({ date: -1 }).limit(14).lean(),
    RoadmapReview.find({ userId: user._id }).countDocuments(),
  ]);

  const interviewScores = interviews.map((i) => i.score ?? i.percentage ?? 0);
  const interviewAvg = interviewScores.length
    ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
    : 0;
  const bestInterviewScore = interviewScores.length ? Math.max(...interviewScores) : 0;

  const resumeScores = resumes.map((r) => r.overallScore || 0);
  const bestResumeScore = resumeScores.length ? Math.max(...resumeScores) : 0;

  const roadmapProgressAvg = roadmapRows.length
    ? Math.round(roadmapRows.reduce((s, r) => s + (r.progress || 0), 0) / roadmapRows.length)
    : user.roadmaps?.length
      ? Math.round(user.roadmaps.reduce((s, r) => s + (r.progress || 0), 0) / user.roadmaps.length)
      : 0;

  const maxRoadmapProgress = roadmapRows.length
    ? Math.max(...roadmapRows.map((r) => r.progress || 0))
    : user.roadmaps?.length
      ? Math.max(...user.roadmaps.map((r) => r.progress || 0))
      : 0;

  const completedRoadmaps = roadmapRows.filter((r) => (r.progress || 0) >= 90).length;
  const advancedTopicsMastered = topics.filter((t) => t.level === "advanced" && t.progress >= 70).length;

  const weekStart = weekAgo();
  const weeklyTargetsCompleted = dailyTargets.filter(
    (d) => d.date >= weekStart && d.completionPercent >= 100
  ).length;

  const totalTargetsCompleted = dailyTargets.filter((d) => d.completionPercent >= 100).length;
  const roadmapsAbove50 = roadmapRows.filter((r) => (r.progress || 0) >= 50).length;
  let projectTasksCompleted = 0;
  for (const d of dailyTargets) {
    for (const t of d.tasks || []) {
      if (t.category === "project" && t.completed) projectTasksCompleted += 1;
    }
  }

  const totalSolved = topics.reduce((s, t) => s + t.solved, 0);
  const totalProblems = topics.reduce((s, t) => s + t.total, 0);
  const dsaMastery = totalProblems ? Math.round((totalSolved / totalProblems) * 100) : 0;

  const weakTopics = topics.filter((t) => t.weak).map((t) => t.name);
  const strongTopics = topics.filter((t) => t.strong).map((t) => t.name);
  const strongestTopic = [...topics].sort((a, b) => b.progress - a.progress)[0]?.name || "—";
  const weakestTopic = [...topics].filter((t) => t.solved > 0).sort((a, b) => a.progress - b.progress)[0]?.name || weakTopics[0] || "Arrays";

  const activityDays = await DailyActivity.distinct("date", { userId: user._id });
  const totalActiveDays = activityDays.length + (user.recentActivities?.length ? 1 : 0);

  const studyHoursEstimate = Math.round(
    totalSolved * 0.25 + interviews.length * 0.5 + resumes.length * 0.3 + roadmapRows.length * 2
  );

  const targetsToday = dailyTargets.find((d) => d.date === todayKey());
  const dailyTargetRate = targetsToday?.completionPercent ?? 0;

  let interviewImprovement = 0;
  if (interviewScores.length >= 2) {
    interviewImprovement = interviewScores[0] - interviewScores[interviewScores.length - 1];
  }

  return {
    dsaSolved: user.dsaProgress?.solvedCount || totalSolved,
    dsaStreak: user.dsaProgress?.streak || 0,
    learningStreak: user.learningStreak || 0,
    dsaMastery,
    interviewAvg,
    bestInterviewScore,
    interviewImprovement,
    bestResumeScore,
    resumeCount: resumes.length,
    roadmapProgressAvg,
    maxRoadmapProgress,
    completedRoadmaps,
    advancedTopicsMastered,
    weeklyTargetsCompleted,
    totalTargetsCompleted,
    roadmapsAbove50,
    projectTasksCompleted,
    totalActiveDays,
    studyHoursEstimate,
    dailyTargetRate,
    feedbackCount: reviews,
    topics,
    weakTopics,
    strongTopics,
    strongestTopic,
    weakestTopic,
    interviews,
    resumes,
    roadmapRows,
    dailyTargets,
    interviewTrend: interviews
      .slice(0, 8)
      .reverse()
      .map((s, i) => ({ name: `S${i + 1}`, score: s.score ?? s.percentage ?? 0 })),
    weeklyConsistency: buildWeeklyConsistency(dailyTargets),
    heatmap: topics.map((t) => ({ topic: t.name, level: t.level, value: t.progress })),
  };
}

function buildWeeklyConsistency(dailyTargets) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = dailyTargets.find((t) => t.date === key);
    days.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      completed: found?.completionPercent ?? 0,
    });
  }
  return days;
}

export function buildInsights(metrics) {
  const insights = [];
  if (metrics.strongestTopic && metrics.strongestTopic !== "—") {
    insights.push(`🔥 You are improving fast in ${metrics.strongestTopic}.`);
  }
  if (metrics.weakestTopic) {
    insights.push(`⚠ ${metrics.weakestTopic} needs more practice.`);
  }
  if (metrics.weeklyTargetsCompleted > 0) {
    insights.push(`🚀 You completed ${metrics.weeklyTargetsCompleted} full daily target sets this week.`);
  }
  if (metrics.interviewImprovement > 0) {
    insights.push(`🏆 Your interview accuracy improved by ${metrics.interviewImprovement}%.`);
  }
  if (metrics.dsaStreak >= 3) {
    insights.push(`🔥 ${metrics.dsaStreak}-day DSA practice streak — keep going!`);
  }
  return insights.slice(0, 6);
}

export function buildRecommendations(metrics) {
  const recs = [];
  if (metrics.weakTopics.length) {
    recs.push({ type: "focus", text: `Focus more on ${metrics.weakTopics[0]}` });
  }
  const lowAdvanced = metrics.topics.find((t) => t.level === "advanced" && t.progress < 30);
  if (lowAdvanced) {
    recs.push({ type: "revision", text: `${lowAdvanced.name} needs revision` });
  }
  if (metrics.strongTopics.length) {
    recs.push({ type: "praise", text: `Excellent consistency in ${metrics.strongTopics[0]}` });
  }
  const nextTopic = metrics.topics.find((t) => t.progress > 0 && t.progress < 70 && !t.weak);
  if (nextTopic) {
    recs.push({ type: "next", text: `Recommended next topic: ${nextTopic.name}` });
  } else {
    const untouched = metrics.topics.find((t) => t.solved === 0);
    if (untouched) recs.push({ type: "next", text: `Start learning: ${untouched.name}` });
  }
  return recs.slice(0, 5);
}

export async function syncAchievements(userId, metrics) {
  const unlocked = [];
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (!def.check(metrics)) continue;
    const existing = await UserAchievement.findOne({ userId, achievementId: def.id });
    if (!existing) {
      const doc = await UserAchievement.create({
        userId,
        achievementId: def.id,
        name: def.name,
        icon: def.icon,
        description: def.description,
        tier: def.tier || "bronze",
        xpReward: def.xpReward || 50,
      });
      unlocked.push(doc);
    }
  }
  return unlocked;
}

export async function syncUserAnalytics(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const metrics = await gatherMetrics(user);
  const newlyUnlocked = await syncAchievements(userId, metrics);
  const achievements = await UserAchievement.find({ userId }).sort({ unlockedAt: -1 }).lean();

  const achievementPayload = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const doc = achievements.find((a) => a.achievementId === def.id);
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      tier: def.tier || doc?.tier || "bronze",
      xpReward: def.xpReward || 50,
      description: def.description,
      unlocked: Boolean(doc),
      unlockedAt: doc?.unlockedAt || null,
    };
  });

  await UserProgress.findOneAndUpdate(
    { userId },
    {
      userId,
      roadmapCompletion: metrics.roadmapProgressAvg,
      dsaMastery: metrics.dsaMastery,
      interviewAvg: metrics.interviewAvg,
      achievementCount: achievements.length,
      studyHoursEstimate: metrics.studyHoursEstimate,
      weeklyGrowth: metrics.interviewImprovement,
      dailyTargetRate: metrics.dailyTargetRate,
      metrics: {
        strongestTopic: metrics.strongestTopic,
        weakestTopic: metrics.weakestTopic,
      },
      lastComputedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  await AnalyticsHistory.findOneAndUpdate(
    { userId, date: todayKey() },
    {
      userId,
      date: todayKey(),
      dsaSolved: metrics.dsaSolved,
      interviewAvg: metrics.interviewAvg,
      roadmapProgress: metrics.roadmapProgressAvg,
      targetsCompleted: metrics.dailyTargetRate >= 100 ? 1 : 0,
      achievementCount: achievements.length,
    },
    { upsert: true }
  );

  const history = await AnalyticsHistory.find({ userId }).sort({ date: -1 }).limit(14).lean();

  return {
    metrics,
    achievements: achievementPayload,
    newlyUnlocked,
    insights: buildInsights(metrics),
    recommendations: buildRecommendations(metrics),
    history: history.reverse(),
    velocity: {
      dsaPerWeek: Math.round(metrics.dsaSolved / Math.max(1, metrics.totalActiveDays / 7)),
      learningSpeed: metrics.studyHoursEstimate > 50 ? "Fast" : metrics.studyHoursEstimate > 20 ? "Steady" : "Building",
    },
  };
}

export async function recordDailyActivity(userId, type, message) {
  const date = todayKey();
  await DailyActivity.findOneAndUpdate(
    { userId, date },
    {
      $push: { activities: { type, message, at: new Date() } },
      $setOnInsert: { userId, date },
    },
    { upsert: true }
  );
}
