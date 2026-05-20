/** Technology roadmap definitions — unique per-tech paths with 4 levels */

import { getTechModules } from "./technologyRoadmapModules.js";

const CATALOG = {
  frontend: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Angular", "Vue", "Tailwind CSS"],
  backend: ["Node.js", "Express.js", "Spring Boot", "Django", "FastAPI"],
  programming: ["Java", "Python", "C", "C++", "Go", "Rust", "DSA"],
  databases: ["MongoDB", "MySQL", "PostgreSQL", "Firebase", "Redis"],
  fullstack: ["MERN", "MEAN", "Java Full Stack"],
  devops: ["Docker", "Kubernetes", "AWS", "Azure", "CI/CD"],
  aiml: ["Machine Learning", "Deep Learning", "NLP", "Generative AI", "LangChain"],
  security: ["Ethical Hacking", "SOC Analyst", "Penetration Testing", "Network Security"],
};

const ICONS = {
  HTML: "🌐",
  CSS: "🎨",
  JavaScript: "📜",
  TypeScript: "🔷",
  React: "⚛️",
  "Next.js": "▲",
  Angular: "🅰️",
  Vue: "💚",
  "Tailwind CSS": "💨",
  "Node.js": "🟢",
  "Express.js": "🚂",
  "Spring Boot": "🍃",
  Django: "🐍",
  FastAPI: "⚡",
  Java: "☕",
  Python: "🐍",
  C: "©️",
  "C++": "➕",
  Go: "🔵",
  Rust: "🦀",
  MongoDB: "🍃",
  MySQL: "🐬",
  PostgreSQL: "🐘",
  Firebase: "🔥",
  Redis: "🔴",
  MERN: "🧱",
  MEAN: "📦",
  "Java Full Stack": "☕",
  Docker: "🐳",
  Kubernetes: "☸️",
  AWS: "☁️",
  Azure: "🔷",
  "CI/CD": "🔄",
  DSA: "🧮",
  "Machine Learning": "🤖",
  "Deep Learning": "🧠",
  NLP: "💬",
  "Generative AI": "✨",
  LangChain: "🔗",
  "Ethical Hacking": "🛡️",
  "SOC Analyst": "👁️",
  "Penetration Testing": "🎯",
  "Network Security": "🔐",
};

function phase(level, title, weeks, modules, projects, extras = {}) {
  return {
    level,
    title,
    weeks,
    modules,
    projects,
    milestones: extras.milestones || [`Complete ${title}`],
    prerequisites: extras.prerequisites || [],
    estimatedHours: weeks * 8,
    resources: extras.resources || [`${title} — official docs`, "freeCodeCamp", "YouTube deep dives"],
    dailyTasks: extras.dailyTasks || modules.slice(0, 3).map((m) => `📚 Study: ${m}`),
    weeklyTargets: extras.weeklyTargets || [`Complete ${modules[0]}`, "Build practice exercises", "Review notes"],
    monthlyGoals: extras.monthlyGoals || [`Master ${title} fundamentals`, "Ship one milestone project"],
    practiceTasks: extras.practiceTasks || ["Hands-on labs", "Code challenges", "Peer review"],
    revisionSchedule: extras.revisionSchedule || ["Weekend concept recap", "Flashcard review", "Quiz yourself"],
    interviewPrep: extras.interviewPrep || ["10 conceptual questions", "2 coding problems", "Mock Q&A"],
    dsaRecommendations: extras.dsaRecommendations || ["Arrays", "Strings", "Hash maps"],
    certifications: extras.certifications || ["Industry micro-certificate", "Platform skill badge"],
    realWorldTasks: extras.realWorldTasks || ["Debug production-like issue", "Code review exercise"],
    status: extras.status || (level === "beginner" ? "in_progress" : level === "intermediate" ? "locked" : "upcoming"),
  };
}

export function buildTechnologyRoadmap(technology, categoryKey = "programming") {
  const icon = ICONS[technology] || "📚";
  const t = technology;
  const spec = getTechModules(t);
  const levels = ["beginner", "intermediate", "advanced", "expert"];
  const titles = [
    `${t} foundations 🚀`,
    `${t} applied development 💻`,
    `${t} production mastery ⚡`,
    `${t} expert & interview-ready 🏆`,
  ];

  const phases = levels.map((level, i) =>
    phase(
      level,
      titles[i],
      [4, 6, 8, 6][i],
      spec.phases[level] || [`${t} ${level} module 1`, `${t} ${level} module 2`],
      spec.projects[level] || [`${t} ${level} project`],
      {
        prerequisites: i === 0 ? spec.prerequisites : [`Complete ${titles[i - 1]}`],
        milestones: [`🎯 ${titles[i]} checkpoint`, `📈 ${t} skill level ${i + 1}`],
        dailyTasks: [`30 min ${t} theory`, `2 ${level} exercises`, "Document learnings"],
        weeklyTargets: [`Finish ${spec.phases[level]?.[0] || t} module`, "Solve practice problems", "Mock Q&A"],
        status: i === 0 ? "in_progress" : i === 1 ? "locked" : "upcoming",
        interviewPrep: [
          `${t} ${level} conceptual drill`,
          "Timed coding / hands-on",
          "Behavioral STAR story",
        ],
        dsaRecommendations:
          t === "DSA"
            ? spec.phases[level]
            : ["Arrays", "Strings", level === "advanced" ? "Trees" : "Hashing"],
      }
    )
  );

  const estimatedWeeks = phases.reduce((s, p) => s + p.weeks, 0);

  return {
    technology: t,
    categoryKey,
    categoryLabel: categoryKey.replace(/([A-Z])/g, " $1").trim(),
    icon,
    title: `🚀 ${t} Career Roadmap`,
    estimatedWeeks,
    estimatedDuration: `${estimatedWeeks} weeks (~${estimatedWeeks * 8}h)`,
    badges: ["🎯 First Steps", "⚡ Builder", "🔥 Production Ready", "🏆 Expert"],
    phases,
    milestones: phases.flatMap((p) => p.milestones),
    mockInterviewTopics: [`${t} fundamentals`, `${t} scenario questions`, "Behavioral + technical mix"],
    certifications: phases.flatMap((p) => p.certifications).slice(0, 6),
    prerequisites: spec.prerequisites,
    trendingTechnologies: spec.trending,
    salaryInsights: spec.salary,
    hiringDemand: spec.hiring,
    careerOpportunities: spec.careers,
    industryRelevance: `High demand for ${t} skills in product companies and startups.`,
    dependencyGraph: phases.map((p, i) => ({
      id: `phase-${i}`,
      label: p.title,
      dependsOn: i > 0 ? [`phase-${i - 1}`] : [],
      modules: p.modules,
    })),
  };
}

export function getAllTechnologies() {
  const list = [];
  for (const [categoryKey, items] of Object.entries(CATALOG)) {
    for (const technology of items) {
      list.push(buildTechnologyRoadmap(technology, categoryKey));
    }
  }
  return list;
}

export function getRoadmapDefinition(technology) {
  for (const [categoryKey, items] of Object.entries(CATALOG)) {
    if (items.includes(technology)) {
      return buildTechnologyRoadmap(technology, categoryKey);
    }
  }
  return buildTechnologyRoadmap(technology, "programming");
}

export function getTechnologyList() {
  return getAllTechnologies().map((r) => ({
    technology: r.technology,
    categoryKey: r.categoryKey,
    icon: r.icon,
    estimatedWeeks: r.estimatedWeeks,
    hiringDemand: r.hiringDemand,
  }));
}

export { CATALOG };
