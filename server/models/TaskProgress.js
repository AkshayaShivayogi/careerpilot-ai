import mongoose from "mongoose";

const taskProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dailyTargetId: { type: mongoose.Schema.Types.ObjectId, ref: "DailyTarget" },
    taskId: { type: String, required: true },
    date: String,
    technology: String,
    title: String,
    category: String,
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "skipped"],
      default: "pending",
    },
    startedAt: Date,
    completedAt: Date,
    actualMinutes: { type: Number, default: 0 },
    scheduledStart: String,
    scheduledEnd: String,
  },
  { timestamps: true }
);

taskProgressSchema.index({ userId: 1, dailyTargetId: 1, taskId: 1 }, { unique: true });

export const TaskProgress = mongoose.model("TaskProgress", taskProgressSchema);
