import mongoose from "mongoose";

const analyticsHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    dsaSolved: { type: Number, default: 0 },
    interviewAvg: { type: Number, default: 0 },
    roadmapProgress: { type: Number, default: 0 },
    targetsCompleted: { type: Number, default: 0 },
    achievementCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

analyticsHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export const AnalyticsHistory = mongoose.model("AnalyticsHistory", analyticsHistorySchema);
