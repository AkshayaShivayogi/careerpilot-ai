import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listExperiences, createExperience } from "../controllers/experienceController.js";

const router = Router();
router.use(requireAuth);
router.get("/", listExperiences);
router.post("/", createExperience);

export default router;
