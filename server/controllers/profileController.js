import { calcProfileCompletion } from "../utils/profileCompletion.js";
import { logActivity } from "../services/activity.js";

export async function getProfile(req, res) {
  const user = req.user.toPublicJSON();
  user.profileCompletion = calcProfileCompletion(req.user);
  res.json({ user });
}

export async function updateProfile(req, res, next) {
  try {
    const fields = [
      "fullName",
      "college",
      "branch",
      "graduationYear",
      "github",
      "linkedin",
      "portfolio",
      "targetRole",
      "experienceLevel",
      "bio",
      "profileImage",
    ];
    for (const key of fields) {
      if (req.body[key] !== undefined) req.user[key] = String(req.body[key]).trim();
    }
    if (Array.isArray(req.body.skills)) {
      req.user.skills = req.body.skills.map((s) => String(s).trim()).filter(Boolean);
    }

    await req.user.save();
    await logActivity(req.user, "profile", "Profile updated");
    const user = req.user.toPublicJSON();
    user.profileCompletion = calcProfileCompletion(req.user);
    res.json({ user });
  } catch (e) {
    next(e);
  }
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Image file required" });
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Allowed formats: JPG, PNG, JPEG, WEBP" });
    }
    req.user.profileImage = `/uploads/avatars/${req.file.filename}`;
    req.user.profilePicture = req.user.profileImage;
    await req.user.save();
    await logActivity(req.user, "profile", "Profile photo updated");
    const user = req.user.toPublicJSON();
    user.profileCompletion = calcProfileCompletion(req.user);
    res.json({ user, imageUrl: req.user.profileImage });
  } catch (e) {
    next(e);
  }
}

export async function deleteAvatar(req, res, next) {
  try {
    req.user.profileImage = "";
    req.user.profilePicture = "";
    await req.user.save();
    await logActivity(req.user, "profile", "Profile photo removed");
    const user = req.user.toPublicJSON();
    user.profileCompletion = calcProfileCompletion(req.user);
    res.json({ user });
  } catch (e) {
    next(e);
  }
}
