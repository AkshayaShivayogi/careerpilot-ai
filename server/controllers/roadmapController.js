import { logActivity } from "../services/activity.js";
import { ROADMAP_CATALOG, buildRoadmap } from "../services/roadmapTemplates.js";

export async function listRoadmaps(req, res) {
  res.json({ roadmaps: req.user.roadmaps || [], catalog: Object.keys(ROADMAP_CATALOG) });
}

export async function createRoadmap(req, res, next) {
  try {
    const track = String(req.body.track || req.body.role || "MERN").trim();
    const userLevel = req.body.userLevel || req.user.experienceLevel || "beginner";
    const roadmap = buildRoadmap(track, userLevel);
    req.user.roadmaps.unshift(roadmap);
    await req.user.save();
    await logActivity(req.user, "roadmap", `Roadmap created: ${roadmap.title}`);
    res.status(201).json({ roadmap: req.user.roadmaps[0], roadmaps: req.user.roadmaps });
  } catch (e) {
    next(e);
  }
}

export async function updateRoadmapProgress(req, res, next) {
  try {
    const { id } = req.params;
    const roadmap = req.user.roadmaps.id(id);
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

    if (req.body.progress != null) {
      roadmap.progress = Math.min(100, Math.max(0, Number(req.body.progress)));
    }

    if (req.body.phaseIndex != null && req.body.module) {
      const phase = roadmap.phases[Number(req.body.phaseIndex)];
      if (phase && !phase.completedModules.includes(req.body.module)) {
        phase.completedModules.push(req.body.module);
        const total = phase.modules?.length || 1;
        phase.progress = Math.round((phase.completedModules.length / total) * 100);
        if (phase.progress >= 100) phase.done = true;
      }
      const phases = roadmap.phases || [];
      roadmap.progress = phases.length
        ? Math.round(phases.reduce((s, p) => s + (p.progress || 0), 0) / phases.length)
        : roadmap.progress;
    }

    await logActivity(req.user, "roadmap", `Roadmap progress: ${roadmap.progress}%`);
    res.json({ roadmap, roadmaps: req.user.roadmaps });
  } catch (e) {
    next(e);
  }
}

export async function saveRoadmap(req, res, next) {
  try {
    const { id } = req.params;
    const oid = req.user.roadmaps.id(id)?._id;
    if (!oid) return res.status(404).json({ message: "Roadmap not found" });
    if (!req.user.savedRoadmapIds.some((x) => x.equals(oid))) {
      req.user.savedRoadmapIds.push(oid);
    }
    await req.user.save();
    await logActivity(req.user, "roadmap", "Roadmap saved to library");
    res.json({ saved: true });
  } catch (e) {
    next(e);
  }
}
