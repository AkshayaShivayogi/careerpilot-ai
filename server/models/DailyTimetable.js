import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    taskId: String,
    title: String,
    category: String,
    startTime: String,
    endTime: String,
    durationMinutes: { type: Number, default: 30 },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    energyLevel: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    completed: { type: Boolean, default: false },
    skipped: { type: Boolean, default: false },
    isBreak: { type: Boolean, default: false },
    breakSuggestion: String,
    focusSession: { type: Boolean, default: false },
  },
  { _id: true }
);

const sessionSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    emoji: String,
    startTime: String,
    endTime: String,
    slots: [slotSchema],
  },
  { _id: false }
);

const dailyTimetableSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dailyTargetId: { type: mongoose.Schema.Types.ObjectId, ref: "DailyTarget" },
    date: { type: String, required: true, index: true },
    technology: { type: String, required: true },
    sessions: { type: [sessionSchema], default: [] },
    slots: { type: [slotSchema], default: [] },
    totalMinutes: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

dailyTimetableSchema.index({ userId: 1, date: 1, technology: 1 }, { unique: true });

export const DailyTimetable = mongoose.model("DailyTimetable", dailyTimetableSchema);
