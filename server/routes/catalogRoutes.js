import { Router } from "express";
import { getTechnologies, resolveTech } from "../controllers/catalogController.js";

const router = Router();

router.get("/technologies", getTechnologies);
router.get("/technologies/:name", resolveTech);

export default router;
