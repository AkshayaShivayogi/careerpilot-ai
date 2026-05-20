import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { resumeUpload, handleMulterError } from "../middleware/uploadMiddleware.js";
import {
  analyzeResume,
  getResumeHistory,
  getResumeById,
  deleteResume,
  listResumes,
  listTargetRoles,
} from "../controllers/resumeController.js";

const router = Router();
router.use(requireAuth);

router.get("/roles", listTargetRoles);
router.get("/history", getResumeHistory);
router.get("/", listResumes);
router.get("/:id", getResumeById);
router.post("/analyze", resumeUpload.single("resume"), handleMulterError, analyzeResume);
router.post("/upload", resumeUpload.single("resume"), handleMulterError, analyzeResume);
router.delete("/:id", deleteResume);

export default router;
