import { Router } from "express";
import { getTrending } from "../controllers/trendingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", requireAuth, getTrending);

export default router;
