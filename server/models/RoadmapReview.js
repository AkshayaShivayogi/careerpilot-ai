import mongoose from "mongoose";

const roadmapReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    authorName: { type: String, default: "" },
    technology: { type: String, required: true, trim: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 2000 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    improvement: { type: String, default: "" },
    experience: { type: String, default: "" },
    reportOutdated: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

roadmapReviewSchema.index({ technology: 1, createdAt: -1 });

export const RoadmapReview = mongoose.model("RoadmapReview", roadmapReviewSchema);
