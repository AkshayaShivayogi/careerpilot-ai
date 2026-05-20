import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import natural from "natural";
import nlp from "compromise";
import { parseResumeSections } from "./resumeParser.js";

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let techData = null;
let trendData = null;

async function loadTechData() {
  if (!techData) {
    const raw = await fs.readFile(path.join(__dirname, "../data/techSkills.json"), "utf8");
    techData = JSON.parse(raw);
  }
  return techData;
}

async function loadTrendData() {
  if (!trendData) {
    const raw = await fs.readFile(path.join(__dirname, "../data/trendingTechnologies.json"), "utf8");
    trendData = JSON.parse(raw);
  }
  return trendData;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findSkillsInText(text, skillList) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const skill of skillList) {
    const s = skill.toLowerCase().trim();
    if (s.length < 2) continue;
    const re = new RegExp(`\\b${escapeRegex(s)}\\b`, "i");
    if (re.test(lower) || lower.includes(s)) {
      found.add(skill);
    }
  }
  return [...found];
}

/** NLP-assisted skill hints from compromise + natural token overlap */
function extractNlpSkillHints(text, catalogSkills) {
  const doc = nlp(text);
  const nouns = doc.nouns().out("array");
  const techLike = doc.match("#Acronym+").out("array");
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const catalogLower = new Map(catalogSkills.map((s) => [s.toLowerCase(), s]));

  const hints = new Set();
  for (const phrase of [...nouns, ...techLike]) {
    const p = String(phrase).toLowerCase().trim();
    if (catalogLower.has(p)) hints.add(catalogLower.get(p));
    for (const [low, orig] of catalogLower) {
      if (low.length > 3 && (p.includes(low) || low.includes(p))) hints.add(orig);
    }
  }
  for (const t of tokens) {
    if (catalogLower.has(t)) hints.add(catalogLower.get(t));
  }
  return [...hints];
}

function computeTfIdfKeywordScore(text, prioritySkills) {
  if (!prioritySkills.length) return 0;
  const tfidf = new TfIdf();
  tfidf.addDocument(text.toLowerCase());
  let total = 0;
  for (const skill of prioritySkills) {
    const measure = tfidf.tfidf(skill.toLowerCase(), 0);
    total += measure > 0 ? Math.min(1, measure * 2) : 0;
  }
  return Math.round((total / prioritySkills.length) * 100);
}

function resolveRoleProfile(targetRole, tech) {
  const key = String(targetRole || "").toLowerCase().trim();
  const profiles = tech.roleProfiles || {};
  if (profiles[key]) return { key, ...profiles[key] };

  const match = Object.keys(profiles).find((p) => key.includes(p) || p.includes(key));
  if (match) return { key: match, ...profiles[match] };

  if (key.includes("mern")) return { key: "mern stack developer", ...profiles["mern stack developer"] };
  if (key.includes("front")) return { key: "frontend developer", ...profiles["frontend developer"] };
  if (key.includes("back")) return { key: "backend developer", ...profiles["backend developer"] };
  if (key.includes("devops") || key.includes("cloud")) return { key: "devops engineer", ...profiles["devops engineer"] };
  if (key.includes("data")) return { key: "data analyst", ...profiles["data analyst"] };
  if (key.includes("python")) return { key: "python developer", ...profiles["python developer"] };
  if (key.includes("java")) return { key: "java developer", ...profiles["java developer"] };

  return { key: "software engineer", ...profiles["software engineer"] };
}

function buildSkillUniverse(profile, tech) {
  const set = new Set();
  for (const cat of profile.categories || []) {
    for (const s of tech.categories[cat] || []) set.add(s);
  }
  for (const p of profile.priority || []) set.add(p);
  return [...set];
}

function computeKeywordDensity(text, skills) {
  if (!skills.length) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const s of skills) {
    if (lower.includes(s.toLowerCase())) hits += 1;
  }
  return Math.round((hits / skills.length) * 100);
}

function scoreFormatting(parsed, text) {
  let score = 0;
  if (parsed.email) score += 15;
  if (parsed.phone) score += 10;
  if (parsed.hasExperience) score += 25;
  if (parsed.hasEducation) score += 20;
  if (parsed.hasProjects) score += 20;
  if (parsed.hasCertifications) score += 10;
  if (/skills|technologies/i.test(text)) score += 10;
  if (parsed.github || parsed.linkedin) score += 10;
  return Math.min(100, score);
}

function scoreExperienceQuality(parsed, text) {
  let score = 0;
  const bullets = (parsed.experience || []).join(" ");
  const combined = `${bullets} ${text}`;
  if (/\d+%|\d+\+|increased|reduced|improved|saved|delivered|led|managed/i.test(combined)) score += 40;
  if (parsed.experience.length >= 2) score += 30;
  if (/(intern|developer|engineer|analyst)/i.test(combined)) score += 20;
  if (parsed.hasExperience) score += 10;
  return Math.min(100, score);
}

function buildSuggestions(parsed, missing, targetRole, scores) {
  const suggestions = [];
  const recommendations = [];

  if (!parsed.hasExperience) {
    suggestions.push("Add a dedicated Experience section with role titles, company names, and date ranges.");
  } else if (scores.experience < 50) {
    suggestions.push("Quantify achievements in experience bullets (metrics, %, revenue, users, latency).");
  }

  if (!parsed.hasProjects) {
    suggestions.push("Include 2–3 projects with tech stack, your role, and measurable outcomes.");
    recommendations.push("Add deployment links (Vercel, Netlify, GitHub Pages) for portfolio projects.");
  }

  if (!parsed.github) {
    suggestions.push("Add your GitHub profile URL — recruiters verify code quality from repositories.");
  }

  if (!parsed.linkedin) {
    suggestions.push("Add LinkedIn URL for professional credibility and ATS contact parsing.");
  }

  if (missing.length) {
    suggestions.push(`Add role-relevant keywords for ${targetRole}: ${missing.slice(0, 5).join(", ")}.`);
  }

  if (parsed.rawTextLength < 400) {
    suggestions.push("Expand resume content — ATS systems favor detailed, keyword-rich descriptions (400+ words).");
  }

  if (!parsed.hasCertifications) {
    recommendations.push("Consider certifications: AWS Cloud Practitioner, Oracle Java, or role-specific credentials.");
  }

  if (scores.formatting < 60) {
    suggestions.push("Use clear section headers: Summary, Skills, Experience, Projects, Education, Certifications.");
  }

  suggestions.push("Start bullets with strong verbs: built, engineered, optimized, automated, scaled, deployed.");
  suggestions.push(`Tailor keywords and project highlights specifically for ${targetRole} job descriptions.`);

  return { suggestions: [...new Set(suggestions)], recommendations: [...new Set(recommendations)] };
}

function buildStrengthsWeaknesses(parsed, extractedSkills, missing, scores) {
  const strengths = [];
  const weaknesses = [];

  if (parsed.hasExperience) strengths.push("Professional experience section detected");
  if (parsed.hasProjects) strengths.push("Projects portfolio section present");
  if (extractedSkills.length >= 8) strengths.push(`Strong technical vocabulary (${extractedSkills.length} skills detected)`);
  if (scores.keyword >= 60) strengths.push("Good keyword alignment with target role");
  if (parsed.github) strengths.push("GitHub profile linked");
  if (scores.experience >= 60) strengths.push("Experience includes measurable impact indicators");

  if (missing.length > 5) weaknesses.push(`${missing.length} priority skills missing for target role`);
  if (!parsed.hasExperience) weaknesses.push("No clear experience section");
  if (parsed.rawTextLength < 300) weaknesses.push("Resume content may be too short for ATS parsing");
  if (scores.formatting < 50) weaknesses.push("Section structure needs improvement");
  if (!parsed.hasCertifications) weaknesses.push("No certifications listed");

  return { strengths, weaknesses };
}

function computeIndustryMetrics(extractedSkills, trends) {
  const allTech = [];
  for (const cat of Object.values(trends)) {
    if (Array.isArray(cat)) allTech.push(...cat);
  }

  const matchedTrends = [];
  for (const skill of extractedSkills) {
    const t = allTech.find((x) => x.name.toLowerCase() === skill.toLowerCase());
    if (t) matchedTrends.push(t);
  }

  if (!matchedTrends.length) {
    return { industryMatch: 45, trendScore: 40, demandPercentage: 50, roleFit: 50 };
  }

  const avgDemand = Math.round(matchedTrends.reduce((a, t) => a + (t.demand || 50), 0) / matchedTrends.length);
  const avgHiring = Math.round(matchedTrends.reduce((a, t) => a + (t.hiring || 50), 0) / matchedTrends.length);
  const industryMatch = Math.round((avgDemand + avgHiring) / 2);
  const trendScore = Math.min(100, Math.round(avgDemand * 0.6 + avgHiring * 0.4));
  const demandPercentage = avgDemand;
  const roleFit = Math.min(100, Math.round((extractedSkills.length / 12) * 50 + industryMatch * 0.5));

  return { industryMatch, trendScore, demandPercentage, roleFit };
}

const CATEGORY_KEYS = [
  "frontend",
  "backend",
  "database",
  "cloud",
  "devops",
  "ai",
  "security",
  "mobile",
  "fullstack",
];

const CATEGORY_MAP = {
  frontend: "frontend",
  backend: "backend",
  database: "database",
  cloud: "cloud",
  devops: "cloud",
  ai: "ai",
  security: "security",
  mobile: "frontend",
  fullstack: "mern",
};

function detectResumeLevel(overallScore, experienceScore, extractedSkills, parsed) {
  if (overallScore >= 82 && parsed.hasExperience && extractedSkills.length >= 14) return "Industry Ready";
  if (overallScore >= 68 && extractedSkills.length >= 10) return "Advanced";
  if (overallScore >= 45) return "Intermediate";
  return "Beginner";
}

function detectGrammarIssues(text) {
  const issues = [];
  if (/\bresponsible for\b/i.test(text)) issues.push("Replace 'responsible for' with strong action verbs");
  if (/\b(duties include|duties included)\b/i.test(text)) issues.push("Avoid duty-focused language — highlight achievements");
  if (/\b(very|really|basically|simply)\b/i.test(text)) issues.push("Remove filler words to tighten professional tone");
  if (!/\d+%|\d+\+|\$\d|users|customers|revenue/i.test(text)) {
    issues.push("Add quantified metrics to experience and project bullets");
  }
  if (text.split(/\s+/).length < 120) issues.push("Resume may be too short — expand with role-specific keywords");
  if (!/github|linkedin|portfolio/i.test(text)) issues.push("Add GitHub, LinkedIn, or portfolio links for credibility");
  return [...new Set(issues)].slice(0, 6);
}

function buildTechnologyRadar(extractedSkills, tech) {
  const cats = tech.categories || {};
  return CATEGORY_KEYS.map((key) => {
    const catKey = CATEGORY_MAP[key] || key;
    const pool = cats[catKey] || cats[key] || [];
    if (!pool.length) return { category: key, match: 0, total: 0, percentage: 0 };
    const matched = pool.filter((s) =>
      extractedSkills.some((e) => e.toLowerCase() === s.toLowerCase())
    );
    const percentage = Math.round((matched.length / pool.length) * 100);
    return {
      category: key.charAt(0).toUpperCase() + key.slice(1),
      match: matched.length,
      total: pool.length,
      percentage: Math.min(100, percentage),
    };
  });
}

function buildMarketDemand(extractedSkills, trends, demandPercentage) {
  const all = Object.values(trends).flat();
  const bySkill = extractedSkills.slice(0, 10).map((skill) => {
    const t = all.find((x) => x.name.toLowerCase() === skill.toLowerCase());
    return { skill, demand: t?.demand || 50, hiring: t?.hiring || 50 };
  });
  return { overall: demandPercentage, skills: bySkill };
}

function buildCareerSuggestions(targetRole, extractedSkills, missingSkills, resumeLevel) {
  const role = targetRole.toLowerCase();
  const suggestions = [];
  const suitableRoles = [];

  if (role.includes("mern") || extractedSkills.some((s) => /react|node|mongo/i.test(s))) {
    suitableRoles.push("MERN Stack Developer", "Full Stack Developer", "React Developer");
  }
  if (extractedSkills.some((s) => /python|django|flask/i.test(s))) {
    suitableRoles.push("Python Developer", "Backend Engineer");
  }
  if (extractedSkills.some((s) => /java|spring/i.test(s))) {
    suitableRoles.push("Java Developer", "Backend Engineer");
  }
  if (extractedSkills.some((s) => /aws|docker|kubernetes/i.test(s))) {
    suitableRoles.push("DevOps Engineer", "Cloud Engineer");
  }
  if (extractedSkills.some((s) => /machine learning|tensorflow|pytorch/i.test(s))) {
    suitableRoles.push("ML Engineer", "AI Engineer");
  }
  if (!suitableRoles.length) {
    suitableRoles.push("Software Engineer", "Junior Developer", targetRole);
  }

  suggestions.push(`Current level: ${resumeLevel} — target roles aligned with your stack`);
  if (missingSkills.length) {
    suggestions.push(`Priority upskilling: ${missingSkills.slice(0, 4).join(", ")}`);
  }
  suggestions.push("Tailor resume keywords to each job description before applying");
  suggestions.push("Highlight 2–3 flagship projects with live demos and measurable impact");
  if (resumeLevel === "Beginner" || resumeLevel === "Intermediate") {
    suggestions.push("Build portfolio projects in your top missing technologies");
    suggestions.push("Practice DSA and system design for technical interview readiness");
  } else {
    suggestions.push("Position yourself for senior roles with leadership and architecture keywords");
    suggestions.push("Track salary benchmarks for your stack in your target market");
  }

  return { careerSuggestions: [...new Set(suggestions)].slice(0, 8), suitableRoles: [...new Set(suitableRoles)].slice(0, 5) };
}

function buildRoadmapSuggestions(targetRole, missingSkills) {
  const role = targetRole.toLowerCase();
  const roadmaps = [];

  const pick = (title, steps) => ({ title, steps: steps.slice(0, 5) });

  if (role.includes("mern") || role.includes("full")) {
    roadmaps.push(
      pick("MERN Stack Roadmap", [
        "Master React hooks, context, and component patterns",
        "Build REST APIs with Express and MongoDB",
        "Add JWT auth and role-based access",
        "Learn Redux or Zustand for state management",
        "Deploy with Docker and AWS/Vercel",
      ])
    );
  }
  if (role.includes("front")) {
    roadmaps.push(
      pick("Frontend Developer Roadmap", [
        "TypeScript fundamentals",
        "React + Vite project structure",
        "CSS/Tailwind responsive layouts",
        "Testing with Jest and React Testing Library",
        "Performance optimization and accessibility",
      ])
    );
  }
  if (role.includes("java")) {
    roadmaps.push(
      pick("Java Backend Roadmap", [
        "Core Java OOP and collections",
        "Spring Boot REST APIs",
        "JPA/Hibernate with PostgreSQL",
        "JUnit and integration testing",
        "Microservices basics",
      ])
    );
  }
  if (role.includes("python")) {
    roadmaps.push(
      pick("Python Developer Roadmap", [
        "Python advanced features",
        "FastAPI or Django APIs",
        "SQL and ORM patterns",
        "pytest and CI pipelines",
        "Cloud deployment basics",
      ])
    );
  }
  if (role.includes("ai") || role.includes("ml")) {
    roadmaps.push(
      pick("AI Engineer Roadmap", [
        "Python for data science",
        "ML fundamentals with scikit-learn",
        "Deep learning with PyTorch/TensorFlow",
        "NLP and LLM integration",
        "MLOps and model deployment",
      ])
    );
  }
  if (missingSkills.some((s) => /docker|kubernetes|aws/i.test(s))) {
    roadmaps.push(
      pick("DevOps & Cloud Roadmap", [
        "Linux and networking basics",
        "Docker containers and Compose",
        "CI/CD with GitHub Actions",
        "AWS core services (EC2, S3, IAM)",
        "Kubernetes fundamentals",
      ])
    );
  }
  if (!roadmaps.length) {
    roadmaps.push(
      pick("Software Engineer Roadmap", [
        "Strengthen DSA and problem solving",
        "Build full-stack capstone project",
        "Learn system design fundamentals",
        "Contribute to open source",
        "Prepare behavioral interviews",
      ])
    );
  }

  return roadmaps.slice(0, 3);
}

function buildInterviewSuggestions(parsed, missingSkills) {
  const tips = [];
  if (!parsed.hasProjects) tips.push("Prepare STAR stories from academic or personal projects");
  if (missingSkills.some((s) => /system design/i.test(s))) tips.push("Study system design for scalable architecture questions");
  tips.push("Practice explaining your top 3 projects in under 2 minutes each");
  tips.push("Review fundamentals of your most-used languages on the resume");
  if (missingSkills.length > 3) tips.push("Expect technical questions on missing stack skills — prepare honest learning narratives");
  return tips;
}

function buildRecommendedProjects(missing, targetRole) {
  const projects = [];
  const role = targetRole.toLowerCase();
  if (missing.some((s) => /docker|kubernetes/i.test(s))) {
    projects.push("Containerized full-stack app with Docker Compose and CI/CD pipeline");
  }
  if (missing.some((s) => /aws|azure|gcp/i.test(s))) {
    projects.push("Cloud-deployed MERN application with S3/EC2 or serverless functions");
  }
  if (role.includes("mern") || role.includes("full")) {
    projects.push("Production MERN SaaS with auth, payments, and admin analytics dashboard");
  }
  if (missing.some((s) => /typescript/i.test(s))) {
    projects.push("TypeScript React app with API integration and unit tests");
  }
  if (projects.length < 2) {
    projects.push("Open-source contribution with README, tests, and live demo URL");
    projects.push("End-to-end capstone project matching your target role tech stack");
  }
  return projects.slice(0, 4);
}

export async function extractTextFromFile(filePath, mimeHint = "") {
  const buf = await fs.readFile(filePath);
  const lower = filePath.toLowerCase();

  if (lower.endsWith(".pdf") || mimeHint.includes("pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buf);
    return (data.text || "").trim();
  }

  if (lower.endsWith(".docx") || mimeHint.includes("wordprocessingml") || mimeHint.includes("docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: buf });
    return (result.value || "").trim();
  }

  throw new Error("Unsupported file format. Upload PDF or DOCX only.");
}

export async function analyzeResumeText(text, targetRole = "software engineer", profileContext = {}) {
  const tech = await loadTechData();
  const trends = await loadTrendData();

  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length < 30) {
    const err = new Error("Could not extract enough text from resume. The file may be scanned or corrupted.");
    err.statusCode = 400;
    throw err;
  }

  const parsed = parseResumeSections(normalized);
  const roleProfile = resolveRoleProfile(targetRole, tech);
  const skillUniverse = buildSkillUniverse(roleProfile, tech);
  const allCatalogSkills = Object.values(tech.categories).flat();

  let extractedSkills = findSkillsInText(normalized, allCatalogSkills);
  const nlpHints = extractNlpSkillHints(normalized, allCatalogSkills);
  extractedSkills = [...new Set([...extractedSkills, ...nlpHints])];
  if (profileContext.skills?.length) {
    for (const s of profileContext.skills) {
      if (normalized.toLowerCase().includes(String(s).toLowerCase())) extractedSkills.push(s);
    }
  }
  extractedSkills = [...new Set(extractedSkills.map((s) => s.trim()).filter(Boolean))];

  const prioritySkills = roleProfile.priority || [];
  const matchedKeywords = prioritySkills.filter((s) =>
    extractedSkills.some((e) => e.toLowerCase() === s.toLowerCase())
  );
  const missingSkills = prioritySkills.filter(
    (s) => !extractedSkills.some((e) => e.toLowerCase() === s.toLowerCase())
  );

  const recommendedSkills = missingSkills.slice(0, 8);
  const priorityMissing = missingSkills.slice(0, 5);

  const keywordDensity = computeKeywordDensity(normalized, prioritySkills);
  const tfidfScore = computeTfIdfKeywordScore(normalized, prioritySkills);
  const keywordScore = Math.round(keywordDensity * 0.55 + tfidfScore * 0.45);
  const formattingScore = scoreFormatting(parsed, normalized);
  const experienceScore = scoreExperienceQuality(parsed, normalized);
  const projectsScore = parsed.hasProjects ? Math.min(100, 60 + parsed.projects.length * 8) : 20;
  const certificationsScore = parsed.hasCertifications ? 85 : parsed.hasEducation ? 40 : 25;
  const roleRelevanceScore = Math.min(100, Math.round((matchedKeywords.length / Math.max(prioritySkills.length, 1)) * 100));

  const grammarScore = Math.min(100, normalized.split(/\s+/).length > 80 ? 78 : 55);
  const heuristicScore = Math.round((formattingScore + experienceScore + projectsScore) / 3);

  const atsScore = Math.round(
    keywordScore * 0.28 +
      formattingScore * 0.22 +
      experienceScore * 0.2 +
      projectsScore * 0.12 +
      roleRelevanceScore * 0.1 +
      certificationsScore * 0.08
  );

  const overallScore = Math.round(
    atsScore * 0.45 + roleRelevanceScore * 0.25 + formattingScore * 0.15 + experienceScore * 0.15
  );

  const sectionScores = {
    keywords: keywordScore,
    formatting: formattingScore,
    experience: experienceScore,
    projects: projectsScore,
    certifications: certificationsScore,
    roleRelevance: roleRelevanceScore,
    education: parsed.hasEducation ? 80 : 35,
    technicalSkills: Math.min(100, Math.round((extractedSkills.length / 15) * 100)),
  };

  const improvementAreas = [];
  if (keywordScore < 60) improvementAreas.push("Keyword optimization for ATS");
  if (!parsed.hasProjects) improvementAreas.push("Project portfolio");
  if (experienceScore < 55) improvementAreas.push("Quantified work experience");
  if (formattingScore < 60) improvementAreas.push("Resume structure and sections");
  if (missingSkills.length > 4) improvementAreas.push("Role-specific skill gaps");

  const industry = computeIndustryMetrics(extractedSkills, trends);
  const { suggestions, recommendations } = buildSuggestions(parsed, missingSkills, targetRole, {
    experience: experienceScore,
    formatting: formattingScore,
    keyword: keywordScore,
  });
  const { strengths, weaknesses } = buildStrengthsWeaknesses(parsed, extractedSkills, missingSkills, {
    keyword: keywordScore,
    experience: experienceScore,
    formatting: formattingScore,
  });

  const skillRadar = prioritySkills.slice(0, 10).map((skill) => {
    const matched = extractedSkills.some((e) => e.toLowerCase() === skill.toLowerCase());
    return {
      skill,
      value: matched ? 100 : 15,
      matched,
    };
  });

  const chartsData = {
    sectionBar: Object.entries(sectionScores).map(([name, value]) => ({ name, value })),
    skillDistribution: extractedSkills.slice(0, 12).map((s) => ({ skill: s, count: 1 })),
    demandTrend: extractedSkills.slice(0, 8).map((skill) => {
      const all = Object.values(trends).flat();
      const t = all.find((x) => x.name.toLowerCase() === skill.toLowerCase());
      return { skill, demand: t?.demand || 50, hiring: t?.hiring || 50 };
    }),
    scoreHistory: [{ label: "Current", score: overallScore }],
  };

  const recommendedProjects = buildRecommendedProjects(missingSkills, targetRole);
  const skillScore = sectionScores.technicalSkills;
  const projectScore = projectsScore;
  const resumeLevel = detectResumeLevel(overallScore, experienceScore, extractedSkills, parsed);
  const grammarIssues = detectGrammarIssues(normalized);
  const technologyRadar = buildTechnologyRadar(extractedSkills, tech);
  const marketDemand = buildMarketDemand(extractedSkills, trends, industry.demandPercentage);
  const { careerSuggestions, suitableRoles } = buildCareerSuggestions(
    targetRole,
    extractedSkills,
    missingSkills,
    resumeLevel
  );
  const roadmapSuggestions = buildRoadmapSuggestions(targetRole, missingSkills);
  const interviewTips = buildInterviewSuggestions(parsed, missingSkills);
  const aiSuggestions = [
    ...suggestions,
    ...recommendations,
    ...interviewTips,
    `Portfolio: showcase ${recommendedProjects[0] || "a capstone project"} on GitHub`,
    parsed.github ? "Keep GitHub repos pinned with README and demo links" : "Add GitHub URL with 3+ quality repositories",
    parsed.linkedin ? "Optimize LinkedIn headline to match target role keywords" : "Create LinkedIn profile aligned with resume keywords",
  ].slice(0, 12);

  chartsData.strengthDistribution = [
    { name: "ATS", value: atsScore },
    { name: "Skills", value: skillScore },
    { name: "Projects", value: projectScore },
    { name: "Experience", value: experienceScore },
    { name: "Industry", value: industry.industryMatch },
  ];
  chartsData.technologyRadar = technologyRadar;
  chartsData.missingSkillsChart = missingSkills.slice(0, 8).map((s) => ({ skill: s, gap: 100 }));

  return {
    overallScore,
    atsScore,
    skillScore,
    projectScore,
    experienceScore,
    sectionScores,
    improvementAreas,
    extracted: {
      name: parsed.name || profileContext.fullName || "",
      email: parsed.email || profileContext.email || "",
      phone: parsed.phone || "",
      skills: extractedSkills,
      education: parsed.education,
      experience: parsed.experience,
      certifications: parsed.certifications,
      projects: parsed.projects,
      technologies: extractedSkills,
      github: parsed.github || profileContext.github || "",
      linkedin: parsed.linkedin || profileContext.linkedin || "",
      rawTextLength: parsed.rawTextLength,
    },
    extractedSkills,
    detectedSkills: extractedSkills,
    matchedKeywords,
    missingSkills,
    recommendedSkills,
    prioritySkills: priorityMissing,
    strengths,
    weaknesses,
    suggestions,
    recommendations,
    recommendedProjects,
    aiSuggestions,
    certifications: parsed.certifications,
    industryMatch: industry.industryMatch,
    roleFit: industry.roleFit,
    trendScore: industry.trendScore,
    demandPercentage: industry.demandPercentage,
    resumeLevel,
    keywordScore,
    keywordDensity: keywordDensity,
    formattingScore,
    heuristicScore,
    grammarScore,
    grammarIssues,
    skillRadar,
    technologyRadar,
    marketDemand,
    careerSuggestions,
    suitableRoles,
    roadmapSuggestions,
    chartsData,
    wordCount: normalized.split(/\s+/).filter(Boolean).length,
    targetRole: roleProfile.key,
  };
}

export async function getTargetRoles() {
  const tech = await loadTechData();
  return Object.keys(tech.roleProfiles || {}).map((k) =>
    k.replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
