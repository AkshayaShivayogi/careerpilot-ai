import { Router } from "express";
import { getDsa, updateDsa } from "../controllers/dsaController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", getDsa);
router.patch("/", updateDsa);

export default router;
