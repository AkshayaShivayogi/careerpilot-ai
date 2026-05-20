/** Client fallback — server catalog is authoritative when API is reachable */

export const CORE_TECHNOLOGIES_FALLBACK = [
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

export const MASTER_TECHNOLOGIES_FALLBACK = [
  ...CORE_TECHNOLOGIES_FALLBACK,
  "MERN Stack",
  "FastAPI",
  "PostgreSQL",
  "Redis",
  "Generative AI",
].sort();

const ALIASES = {
  ai: "AI/ML",
  "deep learning": "Machine Learning",
  "data science": "Machine Learning",
};

export function resolveTechnologyName(input) {
  const raw = String(input || "").trim();
  if (!raw) return CORE_TECHNOLOGIES_FALLBACK[0] || "React";
  const lower = raw.toLowerCase();
  if (ALIASES[lower]) return ALIASES[lower];
  const found = MASTER_TECHNOLOGIES_FALLBACK.find((t) => t.toLowerCase() === lower);
  return found || raw;
}
