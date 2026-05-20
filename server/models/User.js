import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  { type: String, message: String, at: { type: Date, default: Date.now } },
  { _id: false }
);

const roadmapPhaseSchema = new mongoose.Schema(
  {
    level: String,
    title: String,
    weeks: Number,
    modules: [String],
    projects: [String],
    resources: [String],
    completedModules: { type: [String], default: [] },
    progress: { type: Number, default: 0 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    track: { type: String, required: true },
    title: { type: String, required: true },
    userLevel: { type: String, default: "beginner" },
    estimatedWeeks: { type: Number, default: 16 },
    phases: { type: [roadmapPhaseSchema], default: [] },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    stream: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "InterviewQuestion" }],
    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    answers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    pointsEarned: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    weakTopics: { type: [String], default: [] },
    strongTopics: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "completed"], default: "draft" },
    durationSec: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const resumeSchema = new mongoose.Schema(
  {
    fileName: String,
    filePath: String,
    targetRole: String,
    overallScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    heuristicScore: { type: Number, default: 0 },
    formattingScore: { type: Number, default: 0 },
    keywordScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    matchedKeywords: [String],
    missingSkills: [String],
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    skillRadar: { type: [mongoose.Schema.Types.Mixed], default: [] },
    sections: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["uploaded", "analyzed"], default: "uploaded" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const plannerTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: String, default: "" },
    category: { type: String, default: "general" },
  },
  { _id: true }
);

const plannerSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ["weekly", "monthly"], required: true },
    label: { type: String, required: true },
    focus: { type: String, default: "" },
    tasks: { type: [plannerTaskSchema], default: [] },
    progress: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const defaultDsaTopics = () =>
  new Map([
    ["arrays", { solved: 0, total: 25, difficulty: { easy: 10, medium: 10, hard: 5 } }],
    ["strings", { solved: 0, total: 20, difficulty: { easy: 8, medium: 8, hard: 4 } }],
    ["linked list", { solved: 0, total: 18, difficulty: { easy: 6, medium: 8, hard: 4 } }],
    ["stack", { solved: 0, total: 12, difficulty: { easy: 5, medium: 5, hard: 2 } }],
    ["queue", { solved: 0, total: 12, difficulty: { easy: 5, medium: 5, hard: 2 } }],
    ["recursion", { solved: 0, total: 15, difficulty: { easy: 5, medium: 7, hard: 3 } }],
    ["trees", { solved: 0, total: 22, difficulty: { easy: 6, medium: 10, hard: 6 } }],
    ["graphs", { solved: 0, total: 20, difficulty: { easy: 4, medium: 10, hard: 6 } }],
    ["dp", { solved: 0, total: 18, difficulty: { easy: 3, medium: 8, hard: 7 } }],
    ["greedy", { solved: 0, total: 14, difficulty: { easy: 5, medium: 6, hard: 3 } }],
    ["backtracking", { solved: 0, total: 14, difficulty: { easy: 4, medium: 6, hard: 4 } }],
  ]);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, minlength: 8, select: false },
    googleId: { type: String, sparse: true, unique: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    refreshTokenHash: { type: String, select: false },
    profilePicture: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    college: { type: String, default: "" },
    branch: { type: String, default: "" },
    graduationYear: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    targetRole: { type: String, default: "" },
    experienceLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    skills: { type: [String], default: [] },
    bio: { type: String, default: "" },
    learningStreak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    dsaProgress: {
      solvedCount: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      topics: { type: Map, of: mongoose.Schema.Types.Mixed, default: defaultDsaTopics },
    },
    roadmaps: { type: [roadmapSchema], default: [] },
    interviewSessions: { type: [interviewSessionSchema], default: [] },
    resumes: { type: [resumeSchema], default: [] },
    planners: { type: [plannerSchema], default: [] },
    bookmarkedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "InterviewQuestion" }],
    savedRoadmapIds: [{ type: mongoose.Schema.Types.ObjectId }],
    recentActivities: { type: [activitySchema], default: [] },
    analytics: {
      resumeScores: { type: [{ score: Number, at: Date }], default: [] },
      interviewScores: { type: [{ score: Number, at: Date }], default: [] },
    },
  },
  { timestamps: true }
);

userSchema.virtual("name").get(function nameGetter() {
  return this.fullName;
});

userSchema.virtual("name").set(function nameSetter(v) {
  this.fullName = String(v || "").trim();
});

userSchema.pre("save", function syncProfilePicture(next) {
  if (this.profilePicture && !this.profileImage) this.profileImage = this.profilePicture;
  if (this.profileImage && !this.profilePicture) this.profilePicture = this.profileImage;
  next();
});

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  obj.name = obj.fullName;
  if (!obj.profilePicture && obj.profileImage) obj.profilePicture = obj.profileImage;
  if (!obj.profileImage && obj.profilePicture) obj.profileImage = obj.profilePicture;
  if (obj.dsaProgress?.topics instanceof Map) {
    obj.dsaProgress.topics = Object.fromEntries(obj.dsaProgress.topics);
  }
  return obj;
};

export const User = mongoose.model("User", userSchema);
