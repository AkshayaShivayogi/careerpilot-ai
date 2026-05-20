import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {
  getAiStatus,
  aiResumeAnalyze,
  aiInterviewFeedback,
  aiInterviewGenerate,
  aiInterviewEvaluate,
  aiRoadmap,
  aiPlanner,
  aiDailyTargets,
  aiTrending,
  aiSuggestions,
  aiHistory,
} from "../controllers/aiController.js";

const router = Router();

router.get("/status", getAiStatus);
router.use(requireAuth);
router.get("/history", aiHistory);
router.post("/resume", aiResumeAnalyze);
router.post("/interview/generate", aiInterviewGenerate);
router.post("/interview/evaluate", aiInterviewEvaluate);
router.post("/interview/:sessionId/feedback", aiInterviewFeedback);
router.post("/roadmap", aiRoadmap);
router.post("/daily-targets", aiDailyTargets);
router.post("/trending", aiTrending);
router.post("/suggestions", aiSuggestions);

export default router;
