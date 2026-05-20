import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import { getProfile, updateProfile, uploadAvatar, deleteAvatar } from "../controllers/profileController.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
fs.mkdirSync(avatarDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, avatarDir),
    filename: (_r, file, cb) => cb(null, `avatar-${Date.now()}-${file.originalname.replace(/[^\w.\-]/g, "_")}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => {
    const ok = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Allowed formats: JPG, PNG, JPEG, WEBP"), ok);
  },
});

const router = Router();
router.use(requireAuth);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/avatar", (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload failed" });
    next();
  });
}, uploadAvatar);
router.delete("/avatar", deleteAvatar);

export default router;
