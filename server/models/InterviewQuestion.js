import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema(
  {
    stream: { type: String, required: true, index: true },
    technology: { type: String, required: true, index: true },
    contentVersion: { type: Number, default: 2 },

    category: { type: String, default: "Fundamentals" },
    type: {
      type: String,
      enum: [
        "mcq",
        "theory",
        "coding",
        "debugging",
        "scenario",
        "output",
        "hr",
        "system_design",
        "code_analysis",
        "best_practices",
      ],
      default: "theory",
    },
    topic: { type: String, default: "general" },
    companyRelevance: { type: String, default: "Product companies & startups" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      index: true,
    },
    questionNumber: { type: Number },
    question: { type: String, required: true },
    questionHash: { type: String, index: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: "" },
    whyItMatters: { type: String, default: "" },
    realWorldExample: { type: String, default: "" },
    commonMistake: { type: String, default: "" },
    interviewTip: { type: String, default: "" },
    codeSnippet: { type: String, default: "" },
    timeComplexity: { type: String, default: "" },
    spaceComplexity: { type: String, default: "" },
    expectedTime: { type: Number, default: 120 },
    tags: { type: [String], default: [] },
    points: { type: Number, default: 5 },
  },
  { timestamps: true, collection: "interviewquestions" }
);

interviewQuestionSchema.index({ technology: 1, difficulty: 1 });
interviewQuestionSchema.index({ technology: 1, questionHash: 1 }, { unique: true });

export const InterviewQuestion = mongoose.model("InterviewQuestion", interviewQuestionSchema);
