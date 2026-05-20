import { getAllTechnologies, getRoadmapDefinition, getTechnologyList } from "../data/technologyRoadmapCatalog.js";
import { RoadmapProgress } from "../models/RoadmapProgress.js";
import { RoadmapReview } from "../models/RoadmapReview.js";
import { logActivity } from "../services/activity.js";

export async function getCatalog(_req, res) {
  res.json({
    technologies: getTechnologyList(),
    roadmaps: getAllTechnologies(),
  });
}

export async function generateRoadmapProgress(req, res, next) {
  try {
    const technology = String(req.body.technology || req.params.technology || "React").trim();
    const definition = getRoadmapDefinition(technology);
    let doc = await RoadmapProgress.findOne({ userId: req.user._id, technology });
    if (!doc) {
      doc = await RoadmapProgress.create({
        userId: req.user._id,
        technology,
        progress: 0,
        currentPhaseIndex: 0,
        completedModules: [],
        phaseProgress: definition.phases.map((_, i) => ({
          phaseIndex: i,
          progress: 0,
          done: false,
          completedModules: [],
        })),
        earnedBadges: [],
      });
    }
    res.json({ roadmap: definition, progress: doc });
  } catch (e) {
    next(e);
  }
}

export async function getTechnologyRoadmap(req, res) {
  const technology = String(req.params.technology || "React").trim();
  const definition = getRoadmapDefinition(technology);
  const progress = await RoadmapProgress.findOne({ userId: req.user._id, technology });
  res.json({ roadmap: definition, progress: progress || null });
}

export async function upsertProgress(req, res, next) {
  try {
    const technology = String(req.params.technology || "").trim();
    if (!technology) return res.status(400).json({ message: "Technology required" });

    const definition = getRoadmapDefinition(technology);
    let doc = await RoadmapProgress.findOne({ userId: req.user._id, technology });
    if (!doc) {
      doc = new RoadmapProgress({
        userId: req.user._id,
        technology,
        phaseProgress: definition.phases.map((_, i) => ({
          phaseIndex: i,
          progress: i === 0 ? 0 : 0,
          done: false,
          completedModules: [],
        })),
      });
    }

    if (req.body.progress != null) {
      doc.progress = Math.min(100, Math.max(0, Number(req.body.progress)));
    }

    if (req.body.phaseIndex != null && req.body.module) {
      const idx = Number(req.body.phaseIndex);
      const module = String(req.body.module).trim();
      if (!doc.completedModules.includes(module)) doc.completedModules.push(module);
      const pp = doc.phaseProgress.find((p) => p.phaseIndex === idx) || {
        phaseIndex: idx,
        progress: 0,
        done: false,
        completedModules: [],
      };
      if (!pp.completedModules.includes(module)) pp.completedModules.push(module);
      const phaseDef = definition.phases[idx];
      const total = phaseDef?.modules?.length || 1;
      pp.progress = Math.round((pp.completedModules.length / total) * 100);
      pp.done = pp.progress >= 100;
      const existing = doc.phaseProgress.filter((p) => p.phaseIndex !== idx);
      doc.phaseProgress = [...existing, pp].sort((a, b) => a.phaseIndex - b.phaseIndex);
      doc.currentPhaseIndex = idx;
      if (pp.done && definition.phases[idx + 1]) doc.currentPhaseIndex = idx + 1;
      doc.progress = doc.phaseProgress.length
        ? Math.round(doc.phaseProgress.reduce((s, p) => s + (p.progress || 0), 0) / definition.phases.length)
        : doc.progress;
    }

    if (doc.progress >= 25 && !doc.earnedBadges.includes("🎯 First Steps")) {
      doc.earnedBadges.push("🎯 First Steps");
    }
    if (doc.progress >= 60 && !doc.earnedBadges.includes("⚡ Builder")) {
      doc.earnedBadges.push("⚡ Builder");
    }
    if (doc.progress >= 90 && !doc.earnedBadges.includes("🏆 Job Ready")) {
      doc.earnedBadges.push("🏆 Job Ready");
    }

    doc.lastStudiedAt = new Date();
    await doc.save();
    await logActivity(req.user, "roadmap", `${technology} progress: ${doc.progress}%`);
    const { updateProgress } = await import("../services/careerEcosystemService.js");
    const live = await updateProgress(req.user._id, {
      type: "roadmap_module",
      technology,
      xp: 20,
    });
    res.json({ progress: doc, live: live?.live });
  } catch (e) {
    next(e);
  }
}

export async function getRecommendations(req, res) {
  const technology = String(req.query.technology || "React").trim();
  const progress = await RoadmapProgress.find({ userId: req.user._id }).sort({ progress: -1 }).limit(5).lean();
  const completedTechs = progress.filter((p) => p.progress >= 80).map((p) => p.technology);
  const definition = getRoadmapDefinition(technology);
  const phase = definition.phases[progress.find((p) => p.technology === technology)?.currentPhaseIndex || 0];

  const trending = [
    { name: "System Design", reason: "Complement your stack for senior roles" },
    { name: "MongoDB Aggregation", reason: "High-value data skill for full-stack paths" },
    { name: `${technology} Advanced`, reason: "Deepen your active roadmap track" },
  ];

  if (phase?.interviewPrep?.[0]) {
    trending.unshift({ name: phase.interviewPrep[0], reason: "Next step on your current roadmap phase" });
  }

  res.json({
    technology,
    completedTechnologies: completedTechs,
    recommendations: trending.slice(0, 5),
    weakestFromProfile: req.user.targetRole || "Set target role in profile",
  });
}

export async function getRoadmapAnalytics(_req, res) {
  const [progressStats, reviewStats] = await Promise.all([
    RoadmapProgress.aggregate([
      {
        $group: {
          _id: "$technology",
          learners: { $sum: 1 },
          avgProgress: { $avg: "$progress" },
          completions: { $sum: { $cond: [{ $gte: ["$progress", 90] }, 1, 0] } },
        },
      },
      { $sort: { learners: -1 } },
    ]),
    RoadmapReview.aggregate([
      {
        $group: {
          _id: "$technology",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
    ]),
  ]);

  const totalLearners = progressStats.reduce((s, r) => s + r.learners, 0);
  const topReviewed = reviewStats[0];
  const mostLoved = reviewStats.sort((a, b) => b.avgRating - a.avgRating)[0];

  res.json({
    totalLearners,
    averageCompletion:
      progressStats.length
        ? Math.round(
            progressStats.reduce((s, r) => s + (r.avgProgress || 0), 0) / progressStats.length
          )
        : 0,
    topTechnologies: progressStats.slice(0, 8),
    reviewSummary: reviewStats.slice(0, 8),
    mostLovedRoadmap: mostLoved?._id || "React",
    topReviewedTechnology: topReviewed?._id || "React",
    averageRating: topReviewed ? Number(topReviewed.avgRating.toFixed(1)) : 0,
  });
}
