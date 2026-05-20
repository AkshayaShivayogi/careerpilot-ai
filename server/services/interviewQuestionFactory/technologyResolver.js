/**
 * Maps UI / catalog technology names → isolated factory bank keys.
 * Each key has its own concept dataset — no shared generic pools.
 */
const CANONICAL_MAP = {
  react: "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  html: "HTML",
  css: "CSS",
  angular: "Angular",
  vue: "Vue",
  "node.js": "Node.js",
  nodejs: "Node.js",
  node: "Node.js",
  express: "Express",
  "express.js": "Express",
  java: "Java",
  "spring boot": "Spring Boot",
  springboot: "Spring Boot",
  python: "Python",
  django: "Django",
  flask: "Flask",
  php: "PHP",
  laravel: "Laravel",
  mongodb: "MongoDB",
  mongo: "MongoDB",
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  sql: "SQL",
  firebase: "Firebase",
  dsa: "DSA",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  aws: "AWS",
  linux: "Linux",
  "ci/cd": "CI/CD",
  cicd: "CI/CD",
  devops: "DevOps",
  oops: "OOPs",
  oop: "OOPs",
  "operating systems": "Operating Systems",
  os: "Operating Systems",
  dbms: "DBMS",
  "computer networks": "Computer Networks",
  cybersecurity: "cybersecurity",
  security: "cybersecurity",
  "mern stack": "MongoDB",
  mern: "MongoDB",
  "mean stack": "MongoDB",
};

export function resolveFactoryTechnology(technology) {
  const raw = String(technology || "").trim();
  if (!raw) return null;
  const key = raw.toLowerCase();
  if (CANONICAL_MAP[key]) return CANONICAL_MAP[key];
  // Title-case exact match (registry keys)
  const titled = raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  if (CANONICAL_MAP[titled.toLowerCase()]) return CANONICAL_MAP[titled.toLowerCase()];
  return raw;
}

export function listResolvableTechnologies() {
  return [...new Set(Object.values(CANONICAL_MAP))].sort();
}
