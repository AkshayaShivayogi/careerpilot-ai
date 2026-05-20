export function buildCareerGuidance(user) {
  const role = (user.targetRole || "software engineer").toLowerCase();
  const skills = user.skills || [];
  const level = user.experienceLevel || "beginner";

  const techRecommendations = [];
  if (role.includes("front")) techRecommendations.push("React", "TypeScript", "Next.js", "Tailwind CSS");
  else if (role.includes("data")) techRecommendations.push("Python", "SQL", "Pandas", "Power BI");
  else if (role.includes("devops") || role.includes("cloud"))
    techRecommendations.push("Docker", "Kubernetes", "AWS", "Terraform");
  else if (role.includes("ai") || role.includes("ml"))
    techRecommendations.push("Python", "PyTorch", "LangChain", "RAG");
  else techRecommendations.push("JavaScript", "Node.js", "MongoDB", "System Design");

  const missing = techRecommendations.filter((t) => !skills.some((s) => s.toLowerCase().includes(t.toLowerCase())));

  const salaryRanges = {
    beginner: "$55k – $85k",
    intermediate: "$85k – $120k",
    advanced: "$120k – $180k+",
  };

  return {
    summary: `Based on your target role (${user.targetRole || "software engineer"}) and ${level} experience, focus on fundamentals then portfolio projects.`,
    recommendedTechnologies: techRecommendations,
    skillsToLearn: missing.length ? missing : ["Advanced system design", "Testing", "CI/CD"],
    roadmapRecommendation:
      role.includes("front") ? "frontend" : role.includes("data") ? "AI/ML" : role.includes("devops") ? "DevOps" : "MERN",
    salaryGuidance: salaryRanges[level] || salaryRanges.beginner,
    insights: [
      "Complete your profile to unlock personalized ATS resume scoring.",
      "Run weekly interview sessions to track weak topics.",
      "Mark DSA topics daily to maintain your learning streak.",
      missing.length > 0
        ? `Priority upskill: ${missing.slice(0, 3).join(", ")}`
        : "Strong skill alignment — focus on interview practice and projects.",
    ],
    profileCompletion: user.profileCompletion ?? 0,
  };
}
