import mongoose from "mongoose";

const userScheduleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    wakeTime: { type: String, default: "08:00" },
    sleepTime: { type: String, default: "22:00" },
    peakFocus: { type: String, enum: ["morning", "afternoon", "evening"], default: "morning" },
    maxDailyMinutes: { type: Number, default: 360 },
    breakMinutes: { type: Number, default: 15 },
    timezone: { type: String, default: "local" },
  },
  { timestamps: true }
);

export const UserSchedule = mongoose.model("UserSchedule", userScheduleSchema);
