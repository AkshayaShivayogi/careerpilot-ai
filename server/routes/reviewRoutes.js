import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listReviews, createReview, markHelpful, reviewAnalytics } from "../controllers/reviewController.js";

const router = Router();
router.use(requireAuth);
router.get("/analytics", reviewAnalytics);
router.get("/", listReviews);
router.post("/", createReview);
router.post("/:id/helpful", markHelpful);

export default router;
