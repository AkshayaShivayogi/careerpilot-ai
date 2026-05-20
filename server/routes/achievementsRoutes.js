import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listAchievements, unlockCheck } from "../controllers/achievementsController.js";

const router = Router();
router.use(requireAuth);
router.get("/", listAchievements);
router.post("/unlock", unlockCheck);

export default router;
