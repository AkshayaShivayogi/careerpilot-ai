/**
 * Technology-specific roadmap modules — unique learning paths per stack.
 */

export const TECH_ROADMAP_MODULES = {
  React: {
    prerequisites: ["HTML", "CSS", "JavaScript"],
    trending: ["Next.js", "React Server Components", "TanStack Query"],
    salary: { entry: "$70k–95k", mid: "$110k–150k", senior: "$150k–220k" },
    hiring: "Very High",
    careers: ["Frontend Engineer", "React Developer", "UI Engineer", "Full Stack (MERN)"],
    phases: {
      beginner: ["JSX & rendering", "Components & props", "State & events", "Lists & keys"],
      intermediate: ["Hooks (useState, useEffect)", "Custom hooks", "Context API", "React Router"],
      advanced: ["useMemo & useCallback", "Performance profiling", "Error boundaries", "Code splitting & lazy"],
      expert: ["Next.js App Router", "SSR/SSG/ISR", "Testing (RTL/Vitest)", "Production monitoring"],
    },
    projects: {
      beginner: ["Todo app with hooks", "Weather dashboard"],
      intermediate: ["E-commerce product grid", "Auth flow with context"],
      advanced: ["Admin dashboard with charts", "Real-time chat UI"],
      expert: ["Next.js SaaS starter", "Open-source component library"],
    },
  },
  Java: {
    prerequisites: ["Programming basics", "OOP concepts"],
    trending: ["Spring Boot 3", "Virtual threads", "GraalVM native"],
    salary: { entry: "$75k–100k", mid: "$115k–160k", senior: "$160k–240k" },
    hiring: "High",
    careers: ["Java Developer", "Backend Engineer", "Spring Developer", "Enterprise Architect"],
    phases: {
      beginner: ["OOP pillars", "Collections framework", "Exception handling", "Java 17 syntax"],
      intermediate: ["Multithreading & executors", "Streams API", "JDBC & connection pools", "Maven/Gradle"],
      advanced: ["Spring Boot REST", "Hibernate/JPA", "Security (JWT)", "Microservices basics"],
      expert: ["Distributed transactions", "Kafka integration", "JVM tuning & GC", "Cloud-native Java"],
    },
    projects: {
      beginner: ["CLI student manager", "Bank account OOP"],
      intermediate: ["REST API with Spring", "CRUD with JPA"],
      advanced: ["Microservices order system", "OAuth2 auth service"],
      expert: ["Event-driven inventory platform", "Performance-tuned batch jobs"],
    },
  },
  DSA: {
    prerequisites: ["Any programming language", "Big-O basics"],
    trending: ["Interview prep platforms", "Competitive programming", "System design pairing"],
    salary: { entry: "Unlocks $80k+ roles", mid: "FAANG pipeline", senior: "$180k–350k+" },
    hiring: "Critical for top tech",
    careers: ["Software Engineer", "SDE-2/3", "Competitive Programmer", "Technical Interviewer track"],
    phases: {
      beginner: ["Arrays & strings", "Hashing", "Two pointers", "Stack & queue"],
      intermediate: ["Linked lists", "Trees & BST", "Recursion", "Binary search patterns"],
      advanced: ["Graphs BFS/DFS", "Dynamic programming", "Greedy proofs", "Sliding window mastery"],
      expert: ["Segment trees", "Tries", "Advanced graphs", "Interview timed contests"],
    },
    projects: {
      beginner: ["50 easy problems tracker", "Pattern notebook"],
      intermediate: ["Blind 75 tracker", "Weekly contest participation"],
      advanced: ["Company-tagged problem sets", "Mock interview timer app"],
      expert: ["LeetCode hard streak", "Editorial rewrite blog"],
    },
  },
  "Node.js": {
    prerequisites: ["JavaScript", "HTTP basics"],
    trending: ["Fastify", "Bun runtime", "tRPC", "Event-driven microservices"],
    salary: { entry: "$75k–100k", mid: "$115k–155k", senior: "$150k–210k" },
    hiring: "Very High",
    careers: ["Backend Engineer", "Node.js Developer", "API Engineer", "DevOps-adjacent full stack"],
    phases: {
      beginner: ["Event loop & libuv", "Modules CommonJS/ESM", "npm & package.json", "Basic HTTP server"],
      intermediate: ["Express middleware", "Async/await patterns", "JWT auth", "MongoDB with Mongoose"],
      advanced: ["Streams & buffers", "Clustering & PM2", "Rate limiting & caching", "REST API design"],
      expert: ["Microservices", "Message queues", "Memory leak debugging", "Production observability"],
    },
    projects: {
      beginner: ["File-based API", "CLI tool with commander"],
      intermediate: ["REST blog API", "Auth + refresh tokens"],
      advanced: ["Real-time notifications service", "Rate-limited public API"],
      expert: ["Multi-tenant SaaS backend", "Load-tested microservice"],
    },
  },
  MongoDB: {
    prerequisites: ["JSON", "Basic databases"],
    trending: ["Atlas serverless", "Aggregation pipelines", "Change streams"],
    salary: { entry: "$70k–95k", mid: "$105k–145k", senior: "$140k–200k" },
    hiring: "High",
    careers: ["Database Engineer", "Backend Developer", "Full Stack", "Data Engineer"],
    phases: {
      beginner: ["Documents & collections", "CRUD operations", "Schema design basics", "Indexes introduction"],
      intermediate: ["Aggregation pipeline", "Mongoose ODM", "Relationships & embedding", "Transactions"],
      advanced: ["Sharding & replication", "Performance tuning", "Schema versioning", "Security rules"],
      expert: ["Atlas ops", "Cross-region clusters", "Time-series collections", "Migration at scale"],
    },
    projects: {
      beginner: ["Blog database schema", "CRUD with Mongoose"],
      intermediate: ["Analytics aggregation dashboard", "Multi-tenant SaaS data model"],
      advanced: ["Sharding lab", "Change stream event log"],
      expert: ["Zero-downtime migration tool", "Performance audit playbook"],
    },
  },
  Python: {
    prerequisites: ["Programming fundamentals"],
    trending: ["FastAPI", "Pydantic v2", "async Python", "MLOps basics"],
    salary: { entry: "$70k–95k", mid: "$110k–150k", senior: "$150k–220k" },
    hiring: "Very High",
    careers: ["Python Developer", "Backend Engineer", "Data Engineer", "ML Engineer path"],
    phases: {
      beginner: ["Syntax & data types", "List comprehensions", "Functions & modules", "Virtual environments"],
      intermediate: ["OOP in Python", "Decorators & generators", "File I/O & JSON", "pytest basics"],
      advanced: ["FastAPI/Django", "async/await", "NumPy/Pandas intro", "Packaging & deployment"],
      expert: ["GIL & concurrency", "Performance profiling", "C extensions awareness", "Production APIs"],
    },
    projects: {
      beginner: ["Automation scripts", "Data cleaning CLI"],
      intermediate: ["FastAPI REST service", "Web scraper with ethics"],
      advanced: ["ML pipeline script", "Async task queue"],
      expert: ["Production API with observability", "Open-source library contribution"],
    },
  },
};

export function getTechModules(technology) {
  const key = Object.keys(TECH_ROADMAP_MODULES).find(
    (k) => k.toLowerCase() === String(technology || "").toLowerCase()
  );
  if (key) return TECH_ROADMAP_MODULES[key];

  const t = String(technology || "Technology").trim();
  return {
    prerequisites: ["Computer fundamentals", "Git basics"],
    trending: [`${t} ecosystem updates`, "Cloud deployment", "CI/CD"],
    salary: { entry: "$65k–90k", mid: "$100k–140k", senior: "$140k–200k" },
    hiring: "Moderate–High",
    careers: [`${t} Developer`, "Software Engineer", "Full Stack Engineer"],
    phases: {
      beginner: [`${t} syntax & setup`, `${t} core concepts`, "Debugging basics", "Tooling"],
      intermediate: [`${t} APIs & integration`, `${t} patterns`, "Testing", "Real-world patterns"],
      advanced: ["Performance tuning", "Security", "Deployment", "System design touchpoints"],
      expert: ["Production hardening", "Observability", "Team leadership", "Architecture decisions"],
    },
    projects: {
      beginner: [`${t} hello-world`, "Exercise repo"],
      intermediate: [`${t} portfolio project`, "Feature build"],
      advanced: [`Production-grade ${t} app`, "OSS contribution"],
      expert: [`${t} platform at scale`, "Conference talk / blog"],
    },
  };
}
