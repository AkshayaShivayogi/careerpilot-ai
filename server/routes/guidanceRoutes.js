import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getGuidance } from "../controllers/guidanceController.js";

const router = Router();
router.get("/", requireAuth, getGuidance);

export default router;
