import { logActivity } from "../services/activity.js";
import { ensureUserDsaTopics, formatTopicsForClient, DSA_TOPIC_CATALOG } from "../data/dsaTopics.js";
import { getConceptExplanation } from "../data/dsaConceptContent.js";
import { recordDailyActivity } from "../services/analyticsEngine.js";
import { updateProgress, syncUserSkills } from "../services/careerEcosystemService.js";

export async function getDsa(req, res, next) {
  try {
    ensureUserDsaTopics(req.user);
    const topics = formatTopicsForClient(req.user.dsaProgress.topics);
    const weakTopics = topics.filter((t) => t.weak).map((t) => t.name);
    const strongTopics = topics.filter((t) => t.strong).map((t) => t.name);

    const enriched = topics.map((t) => ({
      ...t,
      concept: getConceptExplanation(t.slug),
    }));

    res.json({
      dsa: {
        solvedCount: req.user.dsaProgress?.solvedCount || 0,
        streak: req.user.dsaProgress?.streak || 0,
        topics: enriched,
        conceptCount: DSA_TOPIC_CATALOG.length,
        completionPct: topics.length
          ? Math.round(topics.reduce((s, t) => s + t.progress, 0) / topics.length)
          : 0,
        weakTopics,
        strongTopics,
        strongestTopic: [...topics].sort((a, b) => b.progress - a.progress)[0]?.name,
        weakestTopic: [...topics].filter((t) => t.solved > 0).sort((a, b) => a.progress - b.progress)[0]?.name,
        heatmap: enriched.map((t) => ({ topic: t.name, level: t.level, value: t.progress })),
        radar: enriched.slice(0, 8).map((t) => ({ subject: t.name, value: t.progress })),
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function updateDsa(req, res, next) {
  try {
    ensureUserDsaTopics(req.user);
    const { topic, increment, difficulty, solvedCount, streak } = req.body;
    const slug = topic ? String(topic).toLowerCase().trim() : null;

    if (typeof solvedCount === "number") req.user.dsaProgress.solvedCount = Math.max(0, solvedCount);
    if (typeof streak === "number") req.user.dsaProgress.streak = Math.max(0, streak);

    if (slug) {
      const current = req.user.dsaProgress.topics.get(slug) || { solved: 0, total: 10 };
      const inc = Number(increment) || 1;
      current.solved = Math.min(current.total || 25, (current.solved || 0) + inc);
      current.lastPracticed = new Date();
      current.streak = (current.streak || 0) + 1;
      if (difficulty && current.difficulty) {
        current.difficulty[difficulty] = Math.max(0, (current.difficulty[difficulty] || 0) + 1);
      }
      req.user.dsaProgress.topics.set(slug, current);
      req.user.dsaProgress.solvedCount = (req.user.dsaProgress.solvedCount || 0) + inc;
      req.user.dsaProgress.streak = (req.user.dsaProgress.streak || 0) + 1;
      req.user.learningStreak = (req.user.learningStreak || 0) + 1;
    }

    await req.user.save();
    await logActivity(req.user, "dsa", slug ? `DSA +${increment || 1}: ${slug}` : "DSA progress updated");
    await recordDailyActivity(req.user._id, "dsa", `Solved problem in ${slug || "topic"}`);
    const result = await updateProgress(req.user._id, {
      type: "dsa_solve",
      technology: "DSA",
      xp: 15,
    });
    await syncUserSkills(req.user._id);

    const topics = formatTopicsForClient(req.user.dsaProgress.topics).map((t) => ({
      ...t,
      concept: getConceptExplanation(t.slug),
    }));
    res.json({
      dsa: {
        solvedCount: req.user.dsaProgress.solvedCount,
        streak: req.user.dsaProgress.streak,
        topics,
        completionPct: topics.length
          ? Math.round(topics.reduce((s, t) => s + t.progress, 0) / topics.length)
          : 0,
        weakTopics: topics.filter((t) => t.weak).map((t) => t.name),
        strongTopics: topics.filter((t) => t.strong).map((t) => t.name),
        heatmap: topics.map((t) => ({ topic: t.name, level: t.level, value: t.progress })),
      },
      live: result?.live,
      achievementsUnlocked: result?.analytics?.newlyUnlocked?.length || 0,
    });
  } catch (e) {
    next(e);
  }
}
