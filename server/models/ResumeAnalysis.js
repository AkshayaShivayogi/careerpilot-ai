import mongoose from "mongoose";

const extractedSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    education: [String],
    experience: [String],
    certifications: [String],
    projects: [String],
    technologies: [String],
    github: String,
    linkedin: String,
    rawTextLength: Number,
  },
  { _id: false }
);

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    resumeName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: String,
    targetRole: { type: String, default: "software engineer" },

    extracted: { type: extractedSchema, default: () => ({}) },

    overallScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    skillScore: { type: Number, default: 0 },
    projectScore: { type: Number, default: 0 },
    experienceScore: { type: Number, default: 0 },

    sectionScores: { type: mongoose.Schema.Types.Mixed, default: {} },
    improvementAreas: [String],

    extractedSkills: [String],
    detectedSkills: [String],
    matchedKeywords: [String],
    missingSkills: [String],
    recommendedSkills: [String],
    prioritySkills: [String],

    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    recommendations: [String],
    recommendedProjects: [String],
    aiSuggestions: [String],

    industryMatch: { type: Number, default: 0 },
    roleFit: { type: Number, default: 0 },
    trendScore: { type: Number, default: 0 },
    demandPercentage: { type: Number, default: 0 },
    resumeLevel: { type: String, default: "Beginner" },

    keywordScore: { type: Number, default: 0 },
    keywordDensity: { type: Number, default: 0 },
    formattingScore: { type: Number, default: 0 },
    heuristicScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    grammarIssues: [String],

    skillRadar: { type: [mongoose.Schema.Types.Mixed], default: [] },
    technologyRadar: { type: [mongoose.Schema.Types.Mixed], default: [] },
    marketDemand: { type: mongoose.Schema.Types.Mixed, default: {} },
    chartsData: { type: mongoose.Schema.Types.Mixed, default: {} },

    careerSuggestions: [String],
    roadmapSuggestions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    suitableRoles: [String],

    wordCount: { type: Number, default: 0 },
    status: { type: String, enum: ["uploaded", "analyzed", "failed"], default: "analyzed" },
  },
  { timestamps: true, collection: "resumeanalyses" }
);

resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const ResumeAnalysis = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
