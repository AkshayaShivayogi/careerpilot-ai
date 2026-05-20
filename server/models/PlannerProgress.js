import mongoose from "mongoose";

const taskHistorySchema = new mongoose.Schema(
  {
    taskId: String,
    weekId: String,
    title: String,
    completed: Boolean,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const plannerProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    technology: { type: String, required: true, trim: true, index: true },
    planId: { type: String, default: "" },
    difficulty: { type: String, default: "medium" },
    careerGoal: { type: String, default: "" },
    durationWeeks: { type: Number, default: 8 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    taskProgress: { type: Map, of: Boolean, default: {} },
    taskHistory: { type: [taskHistorySchema], default: [] },
    planSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    analyticsCache: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

plannerProgressSchema.index({ userId: 1, technology: 1 }, { unique: true });

export const PlannerProgress = mongoose.model("PlannerProgress", plannerProgressSchema);
