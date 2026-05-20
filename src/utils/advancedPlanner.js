/** Client-side advanced planner — mirrors server advancedPlannerEngine.js */

function hashId(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 12);
}

const DAYS = [
  { key: "monday", label: "Monday", emoji: "📚", theme: "theory & concepts" },
  { key: "tuesday", label: "Tuesday", emoji: "💻", theme: "coding implementation" },
  { key: "wednesday", label: "Wednesday", emoji: "🧩", theme: "problem solving" },
  { key: "thursday", label: "Thursday", emoji: "🚀", theme: "project building" },
  { key: "friday", label: "Friday", emoji: "🔧", theme: "debugging & optimization" },
  { key: "saturday", label: "Saturday", emoji: "🎯", theme: "mock interview & revision" },
  { key: "sunday", label: "Sunday", emoji: "📈", theme: "analytics & weak-topic recovery" },
];

const TECH_CURRICULUM = {
  HTML: ["Semantic HTML", "Forms & accessibility", "SEO basics", "DOM structure", "Layouts"],
  CSS: ["Flexbox", "Grid", "Responsive design", "Animations", "Design systems"],
  JavaScript: ["Closures", "Async/Promises", "DOM APIs", "ES modules", "Patterns"],
  TypeScript: ["Types", "Generics", "Narrowing", "React+TS", "Build tooling"],
  React: ["Components", "Hooks", "State", "Router", "Performance"],
  "Next.js": ["App Router", "SSR/SSG", "API routes", "Auth", "Deploy"],
  Angular: ["Modules", "RxJS", "Services", "Routing", "Testing"],
  Vue: ["Reactivity", "Composition API", "Vue Router", "Pinia", "Testing"],
  "Node.js": ["Event loop", "Modules", "Streams", "Auth", "Production"],
  Express: ["Routing", "Middleware", "REST", "Validation", "Security"],
  Java: ["OOP", "Collections", "Streams", "Spring", "REST"],
  "Spring Boot": ["IoC", "REST", "JPA", "Security", "Microservices"],
  Python: ["Syntax", "OOP", "Async", "Testing", "Packaging"],
  Django: ["Models", "Views", "DRF", "Auth", "Deploy"],
  Flask: ["Routing", "Blueprints", "SQLAlchemy", "JWT", "Deploy"],
  PHP: ["Syntax", "OOP", "Laravel", "Eloquent", "Security"],
  Laravel: ["MVC", "Eloquent", "Queues", "APIs", "Testing"],
  MongoDB: ["Schema design", "Queries", "Aggregation", "Indexes", "Atlas"],
  MySQL: ["SQL joins", "Normalization", "Indexes", "Transactions", "Tuning"],
  PostgreSQL: ["Advanced SQL", "JSONB", "Indexes", "Replication", "Performance"],
  Firebase: ["Auth", "Firestore", "Rules", "Cloud Functions", "Hosting"],
  DSA: ["Arrays", "Strings", "Trees", "Graphs", "DP"],
  Docker: ["Images", "Compose", "Volumes", "Networking", "CI"],
  Kubernetes: ["Pods", "Services", "Deployments", "Helm", "Observability"],
  AWS: ["IAM", "EC2", "S3", "Lambda", "Architecture"],
  "CI/CD": ["Pipelines", "GitHub Actions", "Testing gates", "Deploy", "Rollback"],
  Linux: ["Shell", "Permissions", "Processes", "Networking", "Systemd"],
  DevOps: ["CI/CD", "Docker", "K8s intro", "IaC", "Monitoring"],
};

function clampWeeks(n) {
  return Math.min(24, Math.max(4, Number(n) || 8));
}

function hoursForDifficulty(difficulty) {
  if (difficulty === "easy" || difficulty === "beginner") return 8;
  if (difficulty === "hard" || difficulty === "advanced") return 16;
  return 12;
}

function topicsForTech(tech) {
  return (
    TECH_CURRICULUM[tech] || [
      `${tech} fundamentals`,
      `${tech} core patterns`,
      `${tech} hands-on labs`,
      `${tech} mini project`,
      `${tech} interview prep`,
    ]
  );
}

function buildDayTasks(day, weekTopic, tech, difficulty, weekIndex) {
  const templates = {
    monday: [
      `📚 Study ${weekTopic} theory`,
      `Read official ${tech} docs (45m)`,
      `Summarize key concepts in notes`,
    ],
    tuesday: [
      `💻 Implement ${weekTopic} examples`,
      `Build small ${tech} snippet`,
      `Push code to GitHub`,
    ],
    wednesday: [
      `🧩 Solve 2 ${difficulty} problems on ${weekTopic}`,
      `Review solutions & patterns`,
      `Track weak areas`,
    ],
    thursday: [
      `🚀 ${tech} mini-feature for ${weekTopic}`,
      `Write README for project slice`,
      `Peer review checklist`,
    ],
    friday: [
      `🔧 Debug & optimize ${weekTopic} code`,
      `Profile performance bottlenecks`,
      `Refactor for clarity`,
    ],
    saturday: [
      `🎯 Mock interview: ${weekTopic}`,
      `Revise flashcards`,
      `Behavioral STAR story draft`,
    ],
    sunday: [
      `📈 Weekly analytics review`,
      `Recover weak topics from ${weekTopic}`,
      `Plan next week priorities`,
    ],
  };
  return (templates[day.key] || [`${day.emoji} ${day.theme}: ${weekTopic}`]).map((t, i) => ({
    id: `w${weekIndex + 1}-${day.key}-${i}`,
    title: t,
    completed: false,
    category: day.theme,
  }));
}

export function buildAdvancedPlanner({
  technology = "React",
  difficulty = "medium",
  careerGoal = "Software Engineer",
  durationWeeks = 8,
  weakTopics = [],
  studyHoursPerWeek,
} = {}) {
  const tech = String(technology || "React").trim();
  const diff = String(difficulty || "medium").toLowerCase();
  const weeks = clampWeeks(durationWeeks);
  const topics = topicsForTech(tech);
  const weekCount = Math.min(weeks, Math.max(4, Math.ceil(weeks)));
  const hours = studyHoursPerWeek || hoursForDifficulty(diff);
  const planId = hashId(`${tech}-${diff}-${weeks}-${careerGoal}`);

  const weekly = Array.from({ length: weekCount }, (_, i) => {
    const topic = topics[i % topics.length];
    const days = DAYS.map((day) => ({
      ...day,
      tasks: buildDayTasks(day, topic, tech, diff, i),
      estimatedHours: Math.round(hours / 7),
    }));
    const flatTopics = days.flatMap((d) => d.tasks.map((t) => t.title));
    return {
      id: `w${i + 1}`,
      title: `Week ${i + 1}: ${topic}`,
      learningObjective: `Master ${topic} for ${careerGoal} at ${diff} level`,
      goal: `${careerGoal} — ${tech} track`,
      status: i === 0 ? "in_progress" : i === 1 ? "upcoming" : "locked",
      completionPct: i === 0 ? 5 : 0,
      estimatedHours: hours,
      streakNote: i === 0 ? "🔥 Start your streak this week" : "",
      days,
      topics: flatTopics.slice(0, 8),
      codingPractice: [`💻 ${topic} coding lab (3h)`, "LeetCode / HackerRank drills"],
      miniProjects: [`🚀 Week ${i + 1} ${tech} feature slice`],
      revision: [`📖 Review ${topic} notes`, "Flashcards 20 min/day"],
      interviewPrep: [`🎯 5 MCQs on ${topic}`, `Explain ${topic} aloud 10m`],
      realWorld: [`🏢 Apply ${topic} to a portfolio scenario`],
      aiRecommendations: weakTopics.length
        ? [`🧠 Focus recovery: ${weakTopics[0]}`]
        : [`🧠 Maintain ${hours}h/week pace`],
    };
  });

  const monthlyPhases = [
    { phase: "Week 1 → Fundamentals", focus: "Core concepts & environment setup" },
    { phase: "Week 2 → Intermediate implementation", focus: "Hands-on builds & patterns" },
    { phase: "Week 3 → Advanced real-world concepts", focus: "Scale, security, best practices" },
    { phase: "Week 4 → Projects + Interview preparation", focus: "Portfolio & mocks" },
  ];

  const monthCount = Math.max(1, Math.ceil(weekCount / 4));
  const monthly = Array.from({ length: monthCount }, (_, mi) => {
    const phase = monthlyPhases[mi % monthlyPhases.length];
    return {
      id: `m${mi + 1}`,
      title: `Month ${mi + 1}: ${tech} — ${phase.phase.split("→")[1]?.trim() || "Growth"}`,
      focus: phase.focus,
      phase: phase.phase,
      status: mi === 0 ? "in_progress" : "upcoming",
      milestones: [
        `🎯 Complete weeks ${mi * 4 + 1}–${Math.min((mi + 1) * 4, weekCount)}`,
        `🚀 Ship portfolio milestone`,
        `📈 Skill checkpoint review`,
      ],
      skillCheckpoints: [`${tech} fundamentals`, `${tech} applied project`, "Communication"],
      projectDeadlines: [`Portfolio v${mi + 1} due end of month`],
      dsaTargets: diff === "advanced" ? ["20 problems/month"] : ["12 problems/month"],
      interviewReadiness: Math.min(95, 40 + mi * 15 + weekCount),
      revisionWeeks: [`Revision week ${mi + 1}`],
      industryTrends: [`🔥 Follow ${tech} hiring trends`, "Update resume bullets"],
      realWorldTasks: ["Contribute to open source or work-like ticket"],
      portfolioTasks: ["GitHub README polish", "Demo video 3 min"],
      githubGoals: ["5 commits/week", "1 PR or project push"],
      resumeGoals: [`Add ${tech} project bullet with metrics`],
      streakGoals: ["7-day learning streak", "No zero days"],
      careerGuidance: [
        `Align ${tech} learning with ${careerGoal}`,
        "Schedule 1 mock interview this month",
      ],
    };
  });

  return {
    name: tech,
    technology: tech,
    difficulty: diff,
    careerGoal: careerGoal || "Software Engineer",
    durationWeeks: weeks,
    planId: `plan-${planId}`,
    geminiGenerated: false,
    fallback: true,
    static: true,
    summary: `Advanced ${tech} roadmap (${diff}) — ${weekCount} weeks toward ${careerGoal}.`,
    weekly,
    monthly,
    dailyTargets: [
      `⚡ ${hours}h/week target`,
      "📚 45m theory daily",
      "💻 60m coding daily",
      "🧩 1 DSA problem",
    ],
    projects: [`🚀 ${tech} portfolio capstone`, `${tech} production-style app`],
    interviewPath: ["Weekly MCQ drill", "Behavioral STAR", "System design reading", "Mock interview"],
    revisionSchedule: ["Sunday deep review", "Wednesday weak-topic drill"],
    dsaPlan: tech === "DSA" ? ["Pattern grind", "Timed contest"] : ["1 easy + 1 medium daily"],
    aiTips: [
      "🧠 Auto-rebalance if you miss 2+ days — reduce next week load 15%",
      "⚡ Watch for burnout — take Sunday recovery seriously",
      weakTopics[0] ? `🎯 Prioritize weak topic: ${weakTopics[0]}` : "🎯 Stay consistent over intensity",
    ],
  };
}

export function computePlannerAnalytics(plan, progress = {}) {
  const weekly = Array.isArray(plan?.weekly) ? plan.weekly : [];
  const monthly = Array.isArray(plan?.monthly) ? plan.monthly : [];

  let totalTasks = 0;
  let doneTasks = 0;
  weekly.forEach((w) => {
    (w.days || []).forEach((d) => {
      (d.tasks || []).forEach((t) => {
        totalTasks += 1;
        if (t.completed || progress?.tasks?.[t.id]) doneTasks += 1;
      });
    });
  });

  const weeklyCompletionPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const completedWeeks = weekly.filter((w) => w.status === "completed").length;
  const monthlyCompletionPct = weekly.length
    ? Math.round((completedWeeks / weekly.length) * 100)
    : 0;

  const mastery = Math.min(100, Math.round(weeklyCompletionPct * 0.6 + monthlyCompletionPct * 0.4));
  const interviewReadiness = Math.min(
    100,
    Math.round(mastery * 0.7 + (plan?.interviewPath?.length || 0) * 3)
  );
  const productivity = Math.min(100, Math.round(mastery * 0.5 + (progress.streak || 0) * 5));

  const pendingTasks = [];
  weekly.forEach((w) => {
    (w.days || []).forEach((d) => {
      (d.tasks || []).forEach((t) => {
        if (!t.completed && !progress?.tasks?.[t.id]) {
          pendingTasks.push({ week: w.title, day: d.label, task: t.title });
        }
      });
    });
  });

  return {
    weeklyCompletionPct,
    monthlyCompletionPct,
    technologyMastery: mastery,
    interviewReadiness,
    productivityScore: productivity,
    learningStreak: progress.streak || 0,
    consistencyGraph: DAYS.map((d, i) => ({
      day: d.label.slice(0, 3),
      completed: Math.min(100, Math.round(weeklyCompletionPct * (0.7 + (i % 3) * 0.1))),
    })),
    pendingTasks: pendingTasks.slice(0, 12),
    upcomingDeadlines: monthly.flatMap((m) =>
      (m.projectDeadlines || []).map((p) => ({ month: m.title, deadline: p }))
    ),
    aiRecommendations: plan?.aiTips || [
      "🧠 Complete pending tasks before adding new topics",
      "📈 Review Sunday analytics to rebalance workload",
    ],
    heatmap: weekly.map((w) => ({
      week: w.title,
      value: w.completionPct ?? 0,
    })),
  };
}

export function safePlanner(input = {}) {
  try {
    const plan = buildAdvancedPlanner(input);
    if (!plan?.weekly?.length) throw new Error("empty plan");
    return { ok: true, plan };
  } catch {
    return {
      ok: true,
      plan: buildAdvancedPlanner({
        technology: "React",
        difficulty: "medium",
        careerGoal: "Software Engineer",
        durationWeeks: 8,
      }),
    };
  }
}

export function safeAnalytics(plan, progress) {
  try {
    return computePlannerAnalytics(plan || safePlanner({}).plan, progress || {});
  } catch {
    return computePlannerAnalytics(safePlanner({}).plan, {});
  }
}
