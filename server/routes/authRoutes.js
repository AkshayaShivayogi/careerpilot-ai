import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  login,
  getMe,
  updateProfile,
  logout,
  refreshToken,
  googleAuth,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again later." },
});

router.use((req, _res, next) => {
  const safe =
    req.method === "GET"
      ? ""
      : ` body=${JSON.stringify({ ...req.body, password: req.body?.password ? "[redacted]" : undefined })}`;
  console.log(`[auth] ${req.method} ${req.baseUrl}${req.path}${safe}`);
  next();
});

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);
router.post("/refresh", refreshToken);
router.post("/google", googleAuth);
router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);
router.post("/logout", requireAuth, logout);

export default router;
