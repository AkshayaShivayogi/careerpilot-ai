import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getLive, postUpdate } from "../controllers/progressController.js";

const router = Router();
router.use(requireAuth);
router.get("/live", getLive);
router.post("/update", postUpdate);

export default router;
