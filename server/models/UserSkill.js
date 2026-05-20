import mongoose from "mongoose";

const skillEntrySchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    slug: String,
    mastery: { type: Number, default: 0, min: 0, max: 100 },
    solved: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    avgSpeedMin: { type: Number, default: 0 },
    revisionCount: { type: Number, default: 0 },
    interviewReadiness: { type: Number, default: 0 },
    weak: { type: Boolean, default: false },
    lastPracticed: Date,
  },
  { _id: false }
);

const userSkillSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    technology: { type: String, default: "DSA" },
    skills: { type: [skillEntrySchema], default: [] },
    overallMastery: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserSkill = mongoose.model("UserSkill", userSkillSchema);
