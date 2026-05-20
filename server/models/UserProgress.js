import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    roadmapCompletion: { type: Number, default: 0 },
    dsaMastery: { type: Number, default: 0 },
    interviewAvg: { type: Number, default: 0 },
    achievementCount: { type: Number, default: 0 },
    studyHoursEstimate: { type: Number, default: 0 },
    weeklyGrowth: { type: Number, default: 0 },
    dailyTargetRate: { type: Number, default: 0 },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastComputedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserProgress = mongoose.model("UserProgress", userProgressSchema);
