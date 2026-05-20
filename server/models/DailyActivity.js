import mongoose from "mongoose";

const activityEntrySchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    message: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const dailyActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    activities: { type: [activityEntrySchema], default: [] },
    dsaSolved: { type: Number, default: 0 },
    targetsDone: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyActivity = mongoose.model("DailyActivity", dailyActivitySchema);
