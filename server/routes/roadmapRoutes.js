import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listRoadmaps, createRoadmap, updateRoadmapProgress, saveRoadmap } from "../controllers/roadmapController.js";
import {
  getCatalog,
  getTechnologyRoadmap,
  upsertProgress,
  getRecommendations,
  getRoadmapAnalytics,
  generateRoadmapProgress,
} from "../controllers/roadmapAdvancedController.js";

const router = Router();
router.use(requireAuth);

router.get("/catalog", getCatalog);
router.post("/generate", generateRoadmapProgress);
router.get("/analytics", getRoadmapAnalytics);
router.get("/recommendations", getRecommendations);
router.get("/tech/:technology", getTechnologyRoadmap);
router.patch("/tech/:technology/progress", upsertProgress);

router.get("/", listRoadmaps);
router.post("/", createRoadmap);
router.patch("/:id/progress", updateRoadmapProgress);
router.post("/:id/save", saveRoadmap);

export default router;
