import { Router } from "express";
import {
  plannerStatus,
  listPlanners,
  generatePlanner,
  regeneratePlanner,
  getPlannerAnalytics,
  updatePlannerTask,
  createPlanner,
  toggleTask,
} from "../controllers/plannerController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

router.get("/status", plannerStatus);
router.post("/generate", optionalAuth, generatePlanner);
router.post("/regenerate", optionalAuth, regeneratePlanner);
router.get("/analytics", optionalAuth, getPlannerAnalytics);
router.post("/task/update", optionalAuth, updatePlannerTask);

router.use(requireAuth);
router.get("/", listPlanners);
router.post("/", createPlanner);
router.patch("/:plannerId/tasks/:taskId/toggle", toggleTask);

export default router;
