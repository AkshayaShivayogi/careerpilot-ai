import mongoose from "mongoose";

const aiFeedbackHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["resume", "interview", "roadmap", "daily_targets", "suggestions"],
      required: true,
    },
    model: { type: String, default: "" },
    inputSummary: { type: String, default: "" },
    output: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

aiFeedbackHistorySchema.index({ userId: 1, type: 1, createdAt: -1 });

export const AiFeedbackHistory = mongoose.model("AiFeedbackHistory", aiFeedbackHistorySchema);
