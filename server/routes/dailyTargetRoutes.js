import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getTodayTargets,
  getTimetable,
  regenerateToday,
  toggleTargetTask,
  skipTargetTask,
  generateTargets,
  completeDailyTargets,
  generateNextDay,
} from "../controllers/dailyTargetController.js";

const router = Router();
router.use(requireAuth);
router.get("/today", getTodayTargets);
router.get("/", getTodayTargets);
router.get("/timetable", getTimetable);
router.post("/generate", generateTargets);
router.post("/regenerate", regenerateToday);
router.post("/complete", completeDailyTargets);
router.post("/next-day", generateNextDay);
router.patch("/:id/tasks/:taskId/toggle", toggleTargetTask);
router.patch("/:id/tasks/:taskId/skip", skipTargetTask);

export default router;
