import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src/pages/Dashboard.jsx");
let s = fs.readFileSync(file, "utf8");

const re =
  /  return \(\r?\n    <div className="space-y-8">\r?\n      <div className="glass-card p-6 sm:p-8">[\s\S]*?\r?\n      <div className="grid gap-6 lg:grid-cols-2">\r?\n/;

const replacement = `  const topTrend = getTopTrending(1)[0];

  return (
    <motion.div className="space-y-8">
      <PageHero
        emoji="🚀"
        title="CareerPilot AI"
        subtitle={\`\${data.welcome || "Welcome"}. Target: \${data.profile?.targetRole || "Set in Profile"}\`}
      >
        {topTrend && (
          <div className="rounded-xl border border-electric-500/30 bg-electric-500/10 px-4 py-2 text-sm">
            🔥 Trending: {topTrend.name} ({topTrend.demand}% demand)
          </div>
        )}
      </PageHero>

      <PremiumModuleGrid
        resume={resume}
        interview={interview}
        stats={{
          learningStreak: data.stats.learningStreak,
          roadmapProgress: data.stats.roadmapProgress,
          dsaSolved: data.stats.dsaSolved,
          profileCompletion: data.profileCompletion,
        }}
      />

      <SmartInsights data={data} interview={interview} />

      <div className="grid gap-6 lg:grid-cols-2">
`;

if (!re.test(s)) {
  console.error("pattern not found");
  process.exit(1);
}

s = s.replace(re, replacement);
// outer wrapper: use div not motion.div for root
s = s.replace('<motion.div className="space-y-8">', '<div className="space-y-8">', 1);

fs.writeFileSync(file, s);
console.log("Dashboard patched OK");
