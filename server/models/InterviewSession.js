import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String },
    answer: String,
    isCorrect: Boolean,
    points: { type: Number, default: 0 },
    correctAnswer: String,
    explanation: String,
    improvementTip: String,
    topic: String,
    aiScore: Number,
    communicationRating: Number,
    confidenceRating: Number,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    technology: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    questionCount: { type: Number, default: 10 },

    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    answers: { type: [answerSchema], default: [] },

    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 0 },

    strengths: [String],
    weaknesses: [String],
    strongTopics: [String],
    weakTopics: [String],
    readiness: { type: String, default: "Needs Practice" },
    skillConfidence: { type: Number, default: 0 },

    aiTips: [String],
    aiFeedback: { type: mongoose.Schema.Types.Mixed, default: null },
    recommendations: [String],
    roadmapSuggestions: { type: [mongoose.Schema.Types.Mixed], default: [] },

    chartsData: { type: mongoose.Schema.Types.Mixed, default: {} },
    explanations: [String],

    aiGenerated: { type: Boolean, default: false },
    questionSource: { type: String, default: "database" },
    reportSummary: { type: String, default: "" },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    durationSec: { type: Number, default: 0 },
    completedAt: Date,
  },
  { timestamps: true, collection: "interviewsessions" }
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);
