import { User } from "../models/User.js";
import { UserSkill } from "../models/UserSkill.js";
import { TaskHistory } from "../models/TaskHistory.js";
import { LearningStats } from "../models/LearningStats.js";
import { RoadmapProgress } from "../models/RoadmapProgress.js";
import { DailyTarget } from "../models/DailyTarget.js";
import { ensureUserDsaTopics, formatTopicsForClient, DSA_TOPIC_CATALOG } from "../data/dsaTopics.js";
import { getConceptExplanation } from "../data/dsaConceptContent.js";
import { gatherMetrics, syncUserAnalytics } from "./analyticsEngine.js";
import { ACHIEVEMENT_DEFINITIONS } from "../data/achievementDefinitions.js";
import { UserAchievement } from "../models/UserAchievement.js";

const XP_PER_LEVEL = 500;

export function levelFromXp(xp) {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export async function ensureLearningStats(userId) {
  let stats = await LearningStats.findOne({ userId });
  if (!stats) {
    stats = await LearningStats.create({ userId });
  }
  return stats;
}

export async function syncUserSkills(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  ensureUserDsaTopics(user);
  const topics = formatTopicsForClient(user.dsaProgress.topics);
  const skills = topics.map((t) => {
    const concept = getConceptExplanation(t.slug);
    return {
      topic: t.name,
      slug: t.slug,
      mastery: t.progress,
      solved: t.solved,
      accuracy: t.solved > 0 ? Math.min(100, 50 + t.progress / 2) : 0,
      avgSpeedMin: t.level === "advanced" ? 35 : 25,
      revisionCount: t.needsRevision ? 1 : 0,
      interviewReadiness: Math.min(100, t.progress + (t.strong ? 15 : 0)),
      weak: t.weak,
      lastPracticed: t.lastPracticed,
      explanation: concept.summary,
      companyFocus: concept.companies,
    };
  });

  const overallMastery = skills.length
    ? Math.round(skills.reduce((s, k) => s + k.mastery, 0) / skills.length)
    : 0;

  return UserSkill.findOneAndUpdate(
    { userId },
    { userId, technology: "DSA", skills, overallMastery, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}

export async function addXp(userId, amount, reason) {
  const stats = await ensureLearningStats(userId);
  stats.xp = (stats.xp || 0) + amount;
  stats.level = levelFromXp(stats.xp);
  stats.meta = { ...stats.meta, lastXpReason: reason, lastXpAt: new Date().toISOString() };
  await stats.save();
  return stats;
}

/**
 * Unified progress event — updates analytics, skills, stats in one call.
 */
export async function updateProgress(userId, event = {}) {
  const { type, technology, taskTitle, category, xp = 10 } = event;
  const user = await User.findById(userId);
  if (!user) return null;

  if (type === "task_complete" && taskTitle) {
    await TaskHistory.create({
      userId,
      title: taskTitle,
      category: category || "roadmap",
      technology: technology || "General",
      productivityScore: 85,
    });
    const stats = await ensureLearningStats(userId);
    stats.taskStreak = (stats.taskStreak || 0) + 1;
    stats.productivityScore = Math.min(100, (stats.productivityScore || 0) + 5);
    stats.focusScore = Math.min(100, (stats.focusScore || 0) + 3);
    stats.consistencyLevel =
      stats.taskStreak >= 14 ? "Legendary" : stats.taskStreak >= 7 ? "Strong" : "Building";
    await stats.save();
    await addXp(userId, xp, `task:${category}`);
  }

  if (type === "dsa_solve") {
    await addXp(userId, 15, "dsa");
    const stats = await ensureLearningStats(userId);
    stats.codingStreak = (stats.codingStreak || 0) + 1;
    await stats.save();
  }

  if (type === "roadmap_module" && technology) {
    await addXp(userId, 20, `roadmap:${technology}`);
  }

  await syncUserSkills(userId);
  const analytics = await syncUserAnalytics(userId);
  const live = await getLiveProgress(userId);
  return { analytics, live };
}

export async function getLiveProgress(userId) {
  const user = await User.findById(userId);
  if (!user) return { ok: false, progress: null };

  const [metrics, stats, skills, roadmaps, todayTargets, achievements] = await Promise.all([
    gatherMetrics(user),
    ensureLearningStats(userId),
    UserSkill.findOne({ userId }).lean(),
    RoadmapProgress.find({ userId }).lean(),
    DailyTarget.find({ userId }).sort({ date: -1 }).limit(3).lean(),
    UserAchievement.find({ userId }).sort({ unlockedAt: -1 }).limit(20).lean(),
  ]);

  const achievementPayload = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const doc = achievements.find((a) => a.achievementId === def.id);
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      tier: def.tier,
      xpReward: def.xpReward,
      description: def.description,
      unlocked: Boolean(doc),
      unlockedAt: doc?.unlockedAt || null,
    };
  });

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    xp: stats.xp,
    level: stats.level,
    productivityScore: stats.productivityScore,
    focusScore: stats.focusScore,
    consistencyLevel: stats.consistencyLevel,
    taskStreak: stats.taskStreak,
    codingStreak: stats.codingStreak,
    dsa: {
      solvedCount: metrics.dsaSolved,
      mastery: metrics.dsaMastery,
      streak: metrics.dsaStreak,
      weakTopics: metrics.weakTopics,
      strongTopics: metrics.strongTopics,
      heatmap: metrics.heatmap,
      concepts: DSA_TOPIC_CATALOG.length,
    },
    roadmaps: roadmaps.map((r) => ({
      technology: r.technology,
      progress: r.progress,
      currentPhaseIndex: r.currentPhaseIndex,
    })),
    dailyTargets: todayTargets,
    achievements: {
      unlocked: achievementPayload.filter((a) => a.unlocked).length,
      total: achievementPayload.length,
      recent: achievementPayload.filter((a) => a.unlocked).slice(0, 5),
    },
    skills: skills?.skills || [],
    overallMastery: skills?.overallMastery ?? metrics.dsaMastery,
    insights: buildInsights(metrics),
    weeklyConsistency: metrics.weeklyConsistency,
    interviewTrend: metrics.interviewTrend,
  };
}

function buildInsights(metrics) {
  const out = [];
  if (metrics.weakestTopic) out.push({ type: "weak", text: `🎯 Focus: ${metrics.weakestTopic}` });
  if (metrics.strongestTopic) out.push({ type: "strong", text: `🔥 Strength: ${metrics.strongestTopic}` });
  if (metrics.learningStreak >= 3) out.push({ type: "streak", text: `⚡ ${metrics.learningStreak}-day streak` });
  return out;
}

export async function unlockAchievementsCheck(userId) {
  const user = await User.findById(userId);
  if (!user) return { unlocked: [] };
  const metrics = await gatherMetrics(user);
  const analytics = await syncUserAnalytics(userId);
  const stats = await ensureLearningStats(userId);
  for (const u of analytics.newlyUnlocked || []) {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === u.achievementId);
    if (def?.xpReward) await addXp(userId, def.xpReward, `achievement:${def.id}`);
  }
  return { unlocked: analytics.newlyUnlocked, stats, achievements: analytics.achievements };
}
