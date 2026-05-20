import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {
  listStreams,
  generateInterview,
  submitAnswer,
  getInterviewHistory,
  getInterviewById,
  getInterviewSession,
  getNextQuestion,
  saveInterviewSession,
  getInterviewAnalytics,
  deleteInterview,
  listSessions,
  createSession,
  bookmarkQuestion,
  getBookmarks,
} from "../controllers/interviewController.js";

const router = Router();

router.get("/streams", listStreams);
router.get("/technologies", listStreams);

router.post("/generate", optionalAuth, generateInterview);
router.post("/submit", optionalAuth, submitAnswer);
router.post("/save", optionalAuth, saveInterviewSession);
router.get("/next", optionalAuth, getNextQuestion);
router.get("/analytics", optionalAuth, getInterviewAnalytics);

router.post("/", optionalAuth, createSession);
router.post("/:id/answer", optionalAuth, submitAnswer);

router.use(requireAuth);
router.get("/history", getInterviewHistory);
router.get("/bookmarks", getBookmarks);
router.get("/", listSessions);
router.post("/bookmark", bookmarkQuestion);
router.delete("/:id", deleteInterview);

router.get("/session/:id", optionalAuth, getInterviewSession);
router.get("/:id", optionalAuth, getInterviewById);

export default router;
