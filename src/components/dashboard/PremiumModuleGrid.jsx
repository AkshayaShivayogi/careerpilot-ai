import PremiumCard from "../premium/PremiumCard.jsx";

export default function PremiumModuleGrid({ resume, interview, stats }) {
  const modules = [
    {
      to: "/resume",
      icon: "🧠",
      title: "AI Resume Analyzer",
      description: "ATS scoring, skill gaps, and industry-ready feedback.",
      accent: "electric",
      stats: [
        { label: "Avg ATS", value: `${resume?.avgScore ?? 0}%` },
        { label: "Runs", value: resume?.totalAnalyses ?? 0 },
      ],
      cta: "Analyze resume",
    },
    {
      to: "/interview",
      icon: "🎯",
      title: "AI Interview Engine",
      description: "100+ questions per tech with detailed explanations.",
      accent: "violet",
      stats: [
        { label: "Avg score", value: `${interview?.avgScore ?? 0}%` },
        { label: "Sessions", value: interview?.totalSessions ?? 0 },
      ],
      cta: "Start mock interview",
    },
    {
      to: "/planner",
      icon: "📅",
      title: "Smart Learning Planner",
      description: "Weekly & monthly roadmaps for every technology.",
      accent: "emerald",
      stats: [
        { label: "Streak", value: `${stats?.learningStreak ?? 0}d` },
        { label: "Roadmap", value: `${stats?.roadmapProgress ?? 0}%` },
      ],
      cta: "Open planner",
    },
    {
      to: "/trending",
      icon: "🔥",
      title: "Trending Technologies",
      description: "Real-world demand, salaries, and hiring trends.",
      accent: "amber",
      stats: [
        { label: "Tracks", value: "40+" },
        { label: "Updated", value: "2025" },
      ],
      cta: "Explore trends",
    },
    {
      to: "/roadmap",
      icon: "🛣️",
      title: "Career Roadmaps",
      description: "Technology-wise paths aligned to your target role.",
      accent: "violet",
      stats: [{ label: "Progress", value: `${stats?.roadmapProgress ?? 0}%` }],
      cta: "View roadmaps",
    },
    {
      to: "/dsa",
      icon: "📊",
      title: "Skill Analytics",
      description: "DSA progress, strengths, and practice insights.",
      accent: "electric",
      stats: [{ label: "Solved", value: stats?.dsaSolved ?? 0 }],
      cta: "Track skills",
    },
    {
      to: "/profile",
      icon: "👤",
      title: "User Profile",
      description: "Goals, skills, and career preferences.",
      accent: "emerald",
      stats: [{ label: "Complete", value: `${stats?.profileCompletion ?? 0}%` }],
      cta: "Edit profile",
    },
    {
      to: "/achievements",
      icon: "🏆",
      title: "Achievements",
      description: "Streaks, milestones, and learning wins.",
      accent: "amber",
      stats: [
        { label: "Streak", value: stats?.learningStreak ?? 0 },
        { label: "DSA", value: stats?.dsaSolved ?? 0 },
      ],
      cta: "View progress",
    },
    {
      to: "/roadmap?tab=daily",
      icon: "⚡",
      title: "Daily Targets",
      description: "Smart daily tasks generated from your roadmap and progress.",
      accent: "electric",
      cta: "Today's plan",
    },
    {
      to: "/progress",
      icon: "📈",
      title: "Progress Tracking",
      description: "Compare technologies and monitor growth over time.",
      accent: "violet",
      cta: "See analytics",
    },
  ];

  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-semibold text-slate-200">Career modules</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m, i) => (
          <PremiumCard key={m.title} {...m} delay={i * 0.04} />
        ))}
      </div>
    </section>
  );
}
