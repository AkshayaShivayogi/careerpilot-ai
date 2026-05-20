import mongoose from "mongoose";

const userAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    achievementId: { type: String, required: true },
    name: String,
    icon: String,
    description: String,
    tier: { type: String, default: "bronze" },
    xpReward: { type: Number, default: 50 },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const UserAchievement = mongoose.model("UserAchievement", userAchievementSchema);
