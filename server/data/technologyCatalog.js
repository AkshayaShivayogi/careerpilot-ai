/**
 * Master technology catalog — single source of truth for planner + interview UIs.
 */

const TECH_ALIASES = {
  ai: "AI/ML",
  "ai/ml": "AI/ML",
  "artificial intelligence": "AI/ML",
  "deep learning": "Machine Learning",
  "data science": "Machine Learning",
  express: "Express.js",
  "spring boot": "Spring Boot",
  springboot: "Spring Boot",
  "system design": "System Design",
  "next js": "Next.js",
  "node js": "Node.js",
  "node.js": "Node.js",
  js: "JavaScript",
  ts: "TypeScript",
  k8s: "Kubernetes",
  golang: "Go",
  "c sharp": "C#",
  csharp: "C#",
};

/** Primary UI technologies */
export const CORE_TECHNOLOGIES = [
  "React",
  "Node.js",
  "Express.js",
  "Java",
  "Spring Boot",
  "Python",
  "Machine Learning",
  "AI/ML",
  "MongoDB",
  "SQL",
  "JavaScript",
  "TypeScript",
  "Next.js",
  "DevOps",
  "System Design",
  "DSA",
  "C",
  "C++",
  "C#",
  "PHP",
  "Go",
  "Rust",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Data Science",
];

export const MASTER_TECHNOLOGIES = [
  ...CORE_TECHNOLOGIES,
  "MERN Stack",
  "FastAPI",
  "PostgreSQL",
  "Redis",
  "Generative AI",
  "Flask",
  "Django",
  "CI/CD",
];

export function getMasterTechnologies() {
  return [...MASTER_TECHNOLOGIES];
}

export function getCoreTechnologies() {
  return [...CORE_TECHNOLOGIES];
}

export function isKnownTechnology(name) {
  const n = String(name || "").trim().toLowerCase();
  return MASTER_TECHNOLOGIES.some((t) => t.toLowerCase() === n);
}

export function resolveTechnologyName(input) {
  const raw = String(input || "").trim();
  if (!raw) return "React";
  const lower = raw.toLowerCase();
  if (TECH_ALIASES[lower]) return TECH_ALIASES[lower];
  const found = MASTER_TECHNOLOGIES.find((t) => t.toLowerCase() === lower);
  return found || raw;
}
