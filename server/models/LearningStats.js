import mongoose from "mongoose";

const learningStatsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    productivityScore: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    consistencyLevel: { type: String, default: "Building" },
    taskStreak: { type: Number, default: 0 },
    codingStreak: { type: Number, default: 0 },
    weeklyGoalsCompleted: { type: Number, default: 0 },
    monthlyGoalsCompleted: { type: Number, default: 0 },
    lastTargetDate: String,
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const LearningStats = mongoose.model("LearningStats", learningStatsSchema);
