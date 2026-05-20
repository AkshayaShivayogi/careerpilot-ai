/** Premium trending tech catalog — used by Trending page & dashboard recommendations */

function t(name, icon, demand, extra = {}) {
  const hiring = extra.hiring ?? Math.min(98, demand - 2);
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    icon,
    demand,
    growth: extra.growth ?? `+${Math.max(2, Math.round(demand / 12))}%`,
    hiring,
    hiringTrend: extra.hiringTrend ?? (hiring >= 85 ? "High" : hiring >= 70 ? "Growing" : "Moderate"),
    salary: extra.salary ?? 80000,
    salaryLabel: extra.salaryLabel ?? `₹${Math.round((extra.salary ?? 80000) / 100000)}LPA`,
    difficulty: extra.difficulty ?? "Medium",
    level: extra.level ?? "Intermediate",
    learningWeeks: extra.learningWeeks ?? 10,
    careers: extra.careers ?? ["Software Engineer", "Full Stack Developer"],
    industryGrowth: extra.industryGrowth ?? (demand >= 90 ? "Rapid" : "Steady"),
    progress: extra.progress ?? Math.floor(demand * 0.35),
  };
}

export const TRENDING_CATEGORIES = {
  frontend: {
    label: "Frontend",
    icon: "💻",
    items: [
      t("React", "⚛️", 92, { growth: "+8%", salary: 1200000, salaryLabel: "₹12LPA", level: "Beginner–Advanced", careers: ["Frontend Dev", "React Engineer"] }),
      t("Next.js", "▲", 88, { growth: "+14%", salary: 1300000, salaryLabel: "₹13LPA", careers: ["Full Stack", "SSR Specialist"] }),
      t("Angular", "🅰️", 72, { salary: 1100000, salaryLabel: "₹11LPA", difficulty: "Medium" }),
      t("Vue", "💚", 70, { growth: "+4%", salary: 1050000, salaryLabel: "₹10.5LPA" }),
      t("Tailwind CSS", "🎨", 85, { growth: "+10%", salary: 900000, salaryLabel: "₹9LPA", difficulty: "Easy", level: "Beginner" }),
      t("TypeScript", "📘", 90, { growth: "+12%", salary: 1150000, salaryLabel: "₹11.5LPA" }),
    ],
  },
  backend: {
    label: "Backend",
    icon: "⚙️",
    items: [
      t("Node.js", "🟢", 89, { salary: 1150000, salaryLabel: "₹11.5LPA" }),
      t("Express.js", "🚂", 84, { salary: 1000000, salaryLabel: "₹10LPA" }),
      t("Spring Boot", "🍃", 90, { salary: 1400000, salaryLabel: "₹14LPA", careers: ["Java Backend", "Microservices Engineer"] }),
      t("Django", "🐍", 82, { salary: 1100000, salaryLabel: "₹11LPA" }),
      t("FastAPI", "⚡", 86, { growth: "+16%", salary: 1200000, salaryLabel: "₹12LPA" }),
    ],
  },
  fullstack: {
    label: "Full Stack",
    icon: "🧩",
    items: [
      t("MERN Stack", "🔰", 90, { salary: 1250000, salaryLabel: "₹12.5LPA", careers: ["MERN Developer", "Startup Engineer"] }),
      t("MEAN Stack", "📦", 72, { salary: 1100000, salaryLabel: "₹11LPA" }),
      t("Java Full Stack", "☕", 88, { salary: 1350000, salaryLabel: "₹13.5LPA" }),
    ],
  },
  languages: {
    label: "Programming Languages",
    icon: "⌨️",
    items: [
      t("Java", "☕", 91, { salary: 1300000, salaryLabel: "₹13LPA" }),
      t("Python", "🐍", 94, { growth: "+10%", salary: 1250000, salaryLabel: "₹12.5LPA" }),
      t("JavaScript", "🟨", 95, { salary: 1150000, salaryLabel: "₹11.5LPA", level: "Beginner" }),
      t("C++", "➕", 78, { salary: 1200000, salaryLabel: "₹12LPA", difficulty: "Hard" }),
      t("Go", "🔵", 80, { growth: "+11%", salary: 1500000, salaryLabel: "₹15LPA" }),
      t("Rust", "🦀", 72, { growth: "+15%", salary: 1600000, salaryLabel: "₹16LPA", difficulty: "Hard" }),
    ],
  },
  database: {
    label: "Databases",
    icon: "🗄️",
    items: [
      t("MongoDB", "🍃", 85, { salary: 1100000, salaryLabel: "₹11LPA" }),
      t("MySQL", "🐬", 88, { salary: 1000000, salaryLabel: "₹10LPA" }),
      t("PostgreSQL", "🐘", 90, { growth: "+8%", salary: 1150000, salaryLabel: "₹11.5LPA" }),
      t("Redis", "🔴", 76, { salary: 1200000, salaryLabel: "₹12LPA" }),
      t("Firebase", "🔥", 74, { salary: 950000, salaryLabel: "₹9.5LPA", level: "Beginner" }),
    ],
  },
  cloud: {
    label: "Cloud & DevOps",
    icon: "☁️",
    items: [
      t("AWS", "☁️", 93, { salary: 1500000, salaryLabel: "₹15LPA", careers: ["Cloud Engineer", "Solutions Architect"] }),
      t("Azure", "🔷", 85, { salary: 1400000, salaryLabel: "₹14LPA" }),
      t("Docker", "🐳", 88, { salary: 1250000, salaryLabel: "₹12.5LPA" }),
      t("Kubernetes", "⎈", 86, { growth: "+12%", salary: 1600000, salaryLabel: "₹16LPA", difficulty: "Hard" }),
      t("CI/CD", "🔄", 82, { salary: 1300000, salaryLabel: "₹13LPA" }),
    ],
  },
  ai: {
    label: "AI / ML",
    icon: "🤖",
    items: [
      t("Generative AI", "✨", 95, { growth: "+22%", salary: 1800000, salaryLabel: "₹18LPA", careers: ["AI Engineer", "Prompt Engineer"] }),
      t("Machine Learning", "📊", 88, { salary: 1500000, salaryLabel: "₹15LPA" }),
      t("Deep Learning", "🧠", 85, { salary: 1600000, salaryLabel: "₹16LPA", difficulty: "Hard" }),
      t("NLP", "💬", 82, { salary: 1450000, salaryLabel: "₹14.5LPA" }),
      t("LangChain", "🔗", 82, { growth: "+18%", salary: 1700000, salaryLabel: "₹17LPA" }),
    ],
  },
  cybersecurity: {
    label: "Cybersecurity",
    icon: "🔐",
    items: [
      t("Ethical Hacking", "🛡️", 87, { growth: "+14%", salary: 1400000, salaryLabel: "₹14LPA", careers: ["Pen Tester", "Security Analyst"] }),
      t("Network Security", "🌐", 84, { salary: 1300000, salaryLabel: "₹13LPA" }),
      t("SOC Analyst", "👁️", 86, { salary: 1250000, salaryLabel: "₹12.5LPA", level: "Beginner–Intermediate" }),
      t("Penetration Testing", "🎯", 83, { salary: 1500000, salaryLabel: "₹15LPA", difficulty: "Hard" }),
    ],
  },
  mobile: {
    label: "Mobile Development",
    icon: "📱",
    items: [
      t("React Native", "📱", 78, { salary: 1100000, salaryLabel: "₹11LPA" }),
      t("Flutter", "🦋", 80, { growth: "+9%", salary: 1150000, salaryLabel: "₹11.5LPA" }),
    ],
  },
};

export const ALL_TECHNOLOGIES = Object.entries(TRENDING_CATEGORIES).flatMap(([categoryKey, cat]) =>
  cat.items.map((item) => ({ ...item, categoryKey, categoryLabel: cat.label }))
);

export function getTechById(id) {
  return ALL_TECHNOLOGIES.find((x) => x.id === id);
}

export function getTopTrending(limit = 6) {
  return [...ALL_TECHNOLOGIES].sort((a, b) => b.demand - a.demand).slice(0, limit);
}

export function recommendNextTech(completed = []) {
  const done = new Set(completed.map((s) => s.toLowerCase()));
  return ALL_TECHNOLOGIES.filter((x) => !done.has(x.name.toLowerCase())).sort((a, b) => b.demand - a.demand)[0];
}
