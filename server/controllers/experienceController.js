import { UserExperience } from "../models/UserExperience.js";

export async function listExperiences(req, res) {
  const technology = req.query.technology ? String(req.query.technology).trim() : null;
  const filter = technology ? { technology } : {};
  const experiences = await UserExperience.find(filter).sort({ createdAt: -1 }).limit(40).lean();
  res.json({ experiences });
}

export async function createExperience(req, res, next) {
  try {
    const technology = String(req.body.technology || "").trim();
    const title = String(req.body.title || "").trim();
    const story = String(req.body.story || "").trim();
    if (!technology || !title || !story) {
      return res.status(400).json({ message: "Technology, title, and story are required" });
    }

    const experience = await UserExperience.create({
      userId: req.user._id,
      authorName: req.user.fullName || "Learner",
      technology,
      title,
      story,
      type: req.body.type || "journey",
      difficulty: req.body.difficulty || req.user.experienceLevel || "beginner",
    });

    res.status(201).json({ experience });
  } catch (e) {
    next(e);
  }
}
