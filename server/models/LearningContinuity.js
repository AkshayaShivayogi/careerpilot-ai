import mongoose from "mongoose";

/** Tracks sequential learning day index and topics per technology */
const learningContinuitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    technology: { type: String, required: true, trim: true },
    dayIndex: { type: Number, default: 0 },
    currentPhaseIndex: { type: Number, default: 0 },
    currentModule: { type: String, default: "" },
    completedTopics: { type: [String], default: [] },
    completedTaskHashes: { type: [String], default: [] },
    lastCompletedDate: String,
    interviewReady: { type: Boolean, default: false },
    courseComplete: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

learningContinuitySchema.index({ userId: 1, technology: 1 }, { unique: true });

export const LearningContinuity = mongoose.model("LearningContinuity", learningContinuitySchema);
