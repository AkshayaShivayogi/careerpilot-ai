import mongoose from "mongoose";

const userExperienceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    authorName: { type: String, default: "" },
    technology: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    story: { type: String, required: true, maxlength: 4000 },
    type: {
      type: String,
      enum: ["journey", "roadmap", "project", "interview", "tips"],
      default: "journey",
    },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userExperienceSchema.index({ createdAt: -1 });

export const UserExperience = mongoose.model("UserExperience", userExperienceSchema);
