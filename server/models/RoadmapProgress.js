import mongoose from "mongoose";

const phaseProgressSchema = new mongoose.Schema(
  {
    phaseIndex: { type: Number, default: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    done: { type: Boolean, default: false },
    completedModules: { type: [String], default: [] },
  },
  { _id: false }
);

const roadmapProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    technology: { type: String, required: true, trim: true, index: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentPhaseIndex: { type: Number, default: 0 },
    phaseProgress: { type: [phaseProgressSchema], default: [] },
    completedModules: { type: [String], default: [] },
    earnedBadges: { type: [String], default: [] },
    lastStudiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

roadmapProgressSchema.index({ userId: 1, technology: 1 }, { unique: true });

export const RoadmapProgress = mongoose.model("RoadmapProgress", roadmapProgressSchema);
