import mongoose from "mongoose";

const taskHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dailyTargetId: { type: mongoose.Schema.Types.ObjectId, ref: "DailyTarget" },
    taskId: String,
    title: String,
    category: String,
    technology: String,
    completedAt: { type: Date, default: Date.now },
    estimatedMinutes: { type: Number, default: 30 },
    productivityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskHistorySchema.index({ userId: 1, completedAt: -1 });

export const TaskHistory = mongoose.model("TaskHistory", taskHistorySchema);
