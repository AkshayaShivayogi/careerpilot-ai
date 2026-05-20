import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getFullAnalytics, getAchievements, getProgressDashboard } from "../controllers/analyticsController.js";
import { postAnalyticsUpdate } from "../controllers/progressController.js";

const router = Router();
router.use(requireAuth);
router.get("/", getFullAnalytics);
router.get("/achievements", getAchievements);
router.post("/update", postAnalyticsUpdate);
router.get("/progress", getProgressDashboard);

export default router;
