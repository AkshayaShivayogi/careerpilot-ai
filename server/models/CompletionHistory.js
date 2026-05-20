import mongoose from "mongoose";

const completionHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true },
    technology: { type: String, required: true },
    tasksTotal: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    completionPercent: { type: Number, default: 0 },
    studyMinutes: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

completionHistorySchema.index({ userId: 1, date: 1, technology: 1 }, { unique: true });

export const CompletionHistory = mongoose.model("CompletionHistory", completionHistorySchema);
