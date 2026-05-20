import { Router } from "express";
import {
  signup,
  login,
  getMe,
  updateProfile,
  logout,
  refreshToken,
  googleAuth,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

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
router.post("/refresh", refreshToken);
router.post("/google", googleAuth);
router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);
router.post("/logout", requireAuth, logout);

export default router;
