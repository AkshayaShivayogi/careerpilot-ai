import mongoose from "mongoose";

const targetTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "roadmap",
        "dsa",
        "interview",
        "revision",
        "project",
        "practice",
        "theory",
        "coding",
        "quiz",
        "debug",
      ],
      default: "roadmap",
    },
    completed: { type: Boolean, default: false },
    estimatedMinutes: { type: Number, default: 30 },
    rescheduled: { type: Boolean, default: false },
  },
  { _id: true }
);

const dailyTargetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true },
    technology: { type: String, required: true, trim: true },
    tasks: { type: [targetTaskSchema], default: [] },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    streak: { type: Number, default: 0 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

dailyTargetSchema.index({ userId: 1, date: 1, technology: 1 }, { unique: true });

export const DailyTarget = mongoose.model("DailyTarget", dailyTargetSchema);
