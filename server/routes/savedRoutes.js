import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getSaved } from "../controllers/savedController.js";

const router = Router();
router.get("/", requireAuth, getSaved);

export default router;
