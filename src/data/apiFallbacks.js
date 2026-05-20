/** Static fallbacks when API / Gemini is unavailable — keeps UI populated */

export const SAVED_EMPTY = {
  roadmaps: [],
  interviewSessions: [],
  resumes: [],
  bookmarkedQuestions: [],
  planners: [],
};

const ROLE_KEYWORDS = {
  "software engineer": ["JavaScript", "Git", "REST APIs", "SQL", "Agile", "Problem solving"],
  "frontend developer": ["React", "HTML", "CSS", "TypeScript", "Responsive design", "Webpack"],
  "backend developer": ["Node.js", "APIs", "SQL", "Authentication", "Caching", "Microservices"],
  "full stack developer": ["React", "Node.js", "MongoDB", "REST", "Docker", "CI/CD"],
  "data analyst": ["Python", "SQL", "Excel", "Tableau", "Statistics", "ETL"],
  "devops engineer": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Terraform"],
  "python developer": ["Python", "Django", "Flask", "SQL", "APIs", "Testing"],
  "java developer": ["Java", "Spring Boot", "SQL", "OOP", "Maven", "JUnit"],
};

function resolveRoleSkills(targetRole) {
  const key = String(targetRole || "software engineer").toLowerCase().trim();
  for (const [role, skills] of Object.entries(ROLE_KEYWORDS)) {
    if (key.includes(role) || role.includes(key)) return [...skills];
  }
  return [...ROLE_KEYWORDS["software engineer"]];
}

/** Local ATS-style analysis when /resume/analyze fails */
export function buildLocalResumeAnalysis(targetRole, fileName = "") {
  const keywords = resolveRoleSkills(targetRole);
  const nameHint = String(fileName || "")
    .replace(/\.(pdf|docx)$/i, "")
    .replace(/[_-]/g, " ")
    .trim();
  const detected = [...keywords];
  if (nameHint.length > 2) detected.unshift(nameHint.split(" ")[0]);

  const missing = ["System design", "Cloud basics", "Testing automation"].filter(
    (s) => !detected.some((d) => d.toLowerCase().includes(s.split(" ")[0].toLowerCase()))
  );

  const sectionScores = {
    contact: 70,
    summary: 55,
    experience: 60,
    education: 65,
    technicalSkills: 58,
    projects: 52,
  };

  const sectionBar = Object.entries(sectionScores).map(([name, value]) => ({
    name: name.replace(/([A-Z])/g, " $1").trim(),
    value,
  }));

  const skillRadar = detected.slice(0, 6).map((skill) => ({
    skill,
    value: 45 + (skill.length % 35),
  }));

  return {
    id: `local-${Date.now()}`,
    resumeName: fileName || "Resume (offline)",
    targetRole,
    localFallback: true,
    aiPowered: false,
    geminiGenerated: false,
    overallScore: 62,
    atsScore: 58,
    skillScore: sectionScores.technicalSkills,
    projectScore: sectionScores.projects,
    experienceScore: sectionScores.experience,
    sectionScores,
    keywordDensity: 48,
    keywordScore: 48,
    industryMatch: 55,
    roleFit: 60,
    demandPercentage: 52,
    resumeLevel: "Intermediate",
    detectedSkills: detected.slice(0, 12),
    extractedSkills: detected.slice(0, 12),
    matchedKeywords: keywords.slice(0, 6),
    missingSkills: missing,
    strengths: [
      "Resume uploaded successfully for offline review",
      `Role target aligned to ${targetRole}`,
      detected.length ? `Keywords detected: ${detected.slice(0, 4).join(", ")}` : "Profile structure present",
    ],
    weaknesses: [
      "Full server analysis unavailable — scores are estimates",
      missing.length ? `Consider adding: ${missing.join(", ")}` : "Add measurable project outcomes",
      "Re-run analysis when the API is back for ATS-grade scoring",
    ],
    aiSuggestions: [
      "Quantify impact with metrics (%, $, time saved)",
      "Tailor summary to the target role keywords",
      "Add 2–3 bullet points per role with action verbs",
      "Include links to GitHub / portfolio if applicable",
    ],
    suggestions: [
      "Use standard section headings (Experience, Education, Skills)",
      "Keep formatting simple for ATS parsers",
    ],
    recommendations: ["Complete online analysis when connected for Gemini insights"],
    skillRadar,
    chartsData: {
      sectionBar,
      demandTrend: detected.slice(0, 5).map((skill) => ({
        skill,
        demand: 60 + (skill.length % 25),
        hiring: 55 + (skill.length % 20),
      })),
      missingSkillsChart: missing.map((skill) => ({ skill, gap: 40 })),
      strengthDistribution: sectionBar,
    },
    suitableRoles: [targetRole, "Software engineer", "Full stack developer"].filter(
      (v, i, a) => a.indexOf(v) === i
    ),
    careerSuggestions: [
      "Practice DSA 30–45 min daily while job searching",
      "Build one portfolio project demonstrating your stack",
    ],
  };
}

export const DSA_FALLBACK = {
  topics: [
    { slug: "arrays", name: "Arrays", level: "beginner", progress: 20, solved: 2, total: 10, recommended: "Two-pointer patterns" },
    { slug: "strings", name: "Strings", level: "beginner", progress: 15, solved: 1, total: 8, recommended: "Sliding window" },
    { slug: "trees", name: "Trees", level: "intermediate", progress: 10, solved: 1, total: 12, recommended: "BFS vs DFS" },
    { slug: "graphs", name: "Graphs", level: "advanced", progress: 5, solved: 0, total: 15, recommended: "Union-find intro" },
    { slug: "dp", name: "Dynamic Programming", level: "advanced", progress: 8, solved: 1, total: 20, recommended: "1D DP basics" },
  ],
  solvedCount: 5,
  streak: 0,
  completionPct: 12,
  strongestTopic: "Arrays",
  weakestTopic: "Graphs",
};

export const ANALYTICS_FALLBACK = {
  velocity: { learningSpeed: "Steady (offline)" },
  weeklyConsistency: [
    { day: "Mon", completed: 40 },
    { day: "Tue", completed: 35 },
    { day: "Wed", completed: 50 },
    { day: "Thu", completed: 30 },
    { day: "Fri", completed: 45 },
    { day: "Sat", completed: 20 },
    { day: "Sun", completed: 25 },
  ],
  metrics: {
    heatmap: DSA_FALLBACK.topics.map((t) => ({
      topic: t.name,
      value: t.progress,
    })),
  },
  recommendations: [
    { text: "Reconnect to sync live progress — showing sample analytics." },
    { text: "Focus on your weakest topic next session." },
  ],
};

export const DASHBOARD_FALLBACK = {
  welcome: "Welcome back",
  profile: { targetRole: "Set in Profile" },
  profileCompletion: 0,
  stats: { learningStreak: 0, roadmapProgress: 0, dsaSolved: 0 },
  features: {
    resume: { avgScore: 0, totalAnalyses: 0, lastScore: 0, lastFileName: null },
    interview: { avgScore: 0, totalSessions: 0, strongestTech: "—", weakestTech: "—" },
  },
  charts: {
    interviewScores: [{ name: "Practice", score: 0 }],
    resumeScores: [{ name: "—", score: 0 }],
  },
  recentActivities: [],
};

export { buildLocalInterviewSession } from "./interviewLocalBank.js";

export function buildRoadmapFallback(technology) {
  const tech = String(technology || "React");
  return {
    roadmap: {
      technology: tech,
      title: `${tech} learning path (offline)`,
      phases: [
        {
          title: "Foundations",
          modules: [
            { name: `${tech} basics`, completed: false },
            { name: "Core syntax & tooling", completed: false },
          ],
        },
        {
          title: "Practice",
          modules: [
            { name: "Hands-on exercises", completed: false },
            { name: "Mini project", completed: false },
          ],
        },
      ],
    },
    progress: { completedModules: 0, totalModules: 4, percent: 0 },
    recommendations: [
      { text: `Review ${tech} fundamentals daily`, priority: "high" },
      { text: "Reconnect to load your saved roadmap progress", priority: "medium" },
    ],
  };
}
