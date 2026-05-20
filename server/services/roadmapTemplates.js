export const ROADMAP_CATALOG = {
  frontend: {
    title: "Frontend Developer",
    estimatedWeeks: 24,
    phases: [
      {
        level: "beginner",
        title: "Web foundations",
        weeks: 6,
        modules: ["HTML semantics", "CSS layout & Flexbox", "JavaScript basics", "DOM APIs"],
        projects: ["Portfolio landing page", "Todo app"],
        resources: ["MDN Web Docs", "freeCodeCamp"],
      },
      {
        level: "intermediate",
        title: "React ecosystem",
        weeks: 8,
        modules: ["React components", "Hooks", "React Router", "State patterns"],
        projects: ["Dashboard UI", "E-commerce storefront"],
        resources: ["React docs", "Epic React patterns"],
      },
      {
        level: "advanced",
        title: "Production frontend",
        weeks: 10,
        modules: ["TypeScript", "Testing", "Performance", "Accessibility"],
        projects: ["SaaS admin panel", "Design system"],
        resources: ["web.dev", "Testing Library"],
      },
    ],
  },
  backend: {
    title: "Backend Developer",
    estimatedWeeks: 26,
    phases: [
      {
        level: "beginner",
        title: "Server fundamentals",
        weeks: 6,
        modules: ["HTTP", "Node.js", "Express routing", "REST design"],
        projects: ["CRUD API", "Auth API"],
        resources: ["Node.js docs", "Express guide"],
      },
      {
        level: "intermediate",
        title: "Data & security",
        weeks: 9,
        modules: ["MongoDB", "SQL basics", "JWT auth", "Validation"],
        projects: ["Blog API", "Role-based API"],
        resources: ["Mongoose docs", "OWASP cheat sheet"],
      },
      {
        level: "advanced",
        title: "Scalable systems",
        weeks: 11,
        modules: ["Caching", "Queues", "Microservices intro", "Observability"],
        projects: ["Rate-limited API", "Event-driven worker"],
        resources: ["System Design Primer"],
      },
    ],
  },
  MERN: {
    title: "MERN Stack",
    estimatedWeeks: 28,
    phases: [
      {
        level: "beginner",
        title: "MERN basics",
        weeks: 7,
        modules: ["MongoDB", "Express", "React", "Node integration"],
        projects: ["Notes app full stack"],
        resources: ["MERN tutorials", "MongoDB University"],
      },
      {
        level: "intermediate",
        title: "Full product build",
        weeks: 10,
        modules: ["Auth flows", "File uploads", "Deployment", "State management"],
        projects: ["Career tracker app"],
        resources: ["Vite docs", "Render/Railway deploy guides"],
      },
      {
        level: "advanced",
        title: "Production MERN",
        weeks: 11,
        modules: ["Testing", "CI/CD", "Security hardening", "Performance"],
        projects: ["SaaS MVP launch"],
        resources: ["Jest", "GitHub Actions"],
      },
    ],
  },
  "AI/ML": {
    title: "AI / ML Engineer",
    estimatedWeeks: 32,
    phases: [
      {
        level: "beginner",
        title: "Math & Python",
        weeks: 8,
        modules: ["Python", "NumPy", "Pandas", "Statistics"],
        projects: ["EDA notebook", "Regression model"],
        resources: ["Kaggle Learn", "fast.ai"],
      },
      {
        level: "intermediate",
        title: "ML foundations",
        weeks: 12,
        modules: ["scikit-learn", "Feature engineering", "Model evaluation", "NLP basics"],
        projects: ["Classifier pipeline", "Sentiment analyzer"],
        resources: ["Hands-On ML book"],
      },
      {
        level: "advanced",
        title: "Deep learning & LLMs",
        weeks: 12,
        modules: ["PyTorch", "Transformers", "RAG", "MLOps"],
        projects: ["RAG chatbot", "Fine-tuned model API"],
        resources: ["Hugging Face course"],
      },
    ],
  },
  DSA: {
    title: "DSA Mastery",
    estimatedWeeks: 20,
    phases: [
      {
        level: "beginner",
        title: "Core structures",
        weeks: 6,
        modules: ["Arrays", "Strings", "Hash maps", "Two pointers"],
        projects: ["50 easy problems"],
        resources: ["NeetCode roadmap"],
      },
      {
        level: "intermediate",
        title: "Trees & graphs",
        weeks: 7,
        modules: ["Binary trees", "BST", "BFS/DFS", "Heaps"],
        projects: ["75 medium problems"],
        resources: ["LeetCode explore"],
      },
      {
        level: "advanced",
        title: "DP & system design",
        weeks: 7,
        modules: ["Dynamic programming", "Greedy", "Backtracking", "Design patterns"],
        projects: ["Mock interviews weekly"],
        resources: ["Grokking DP"],
      },
    ],
  },
  DevOps: {
    title: "DevOps Engineer",
    estimatedWeeks: 24,
    phases: [
      {
        level: "beginner",
        title: "Linux & scripting",
        weeks: 5,
        modules: ["Linux CLI", "Bash", "Networking basics", "Git"],
        projects: ["Server setup script"],
        resources: ["Linux Journey"],
      },
      {
        level: "intermediate",
        title: "Containers & CI",
        weeks: 9,
        modules: ["Docker", "Docker Compose", "GitHub Actions", "Nginx"],
        projects: ["CI pipeline for MERN app"],
        resources: ["Docker docs"],
      },
      {
        level: "advanced",
        title: "Kubernetes & cloud",
        weeks: 10,
        modules: ["K8s", "Helm", "AWS ECS/EKS", "Terraform"],
        projects: ["Deploy microservices cluster"],
        resources: ["K8s official tutorials"],
      },
    ],
  },
};

export function buildRoadmap(trackKey, userLevel = "beginner") {
  const template = ROADMAP_CATALOG[trackKey] || ROADMAP_CATALOG.MERN;
  const phases = template.phases.map((p) => ({
    ...p,
    completedModules: [],
    progress: 0,
    done: false,
  }));
  return {
    track: trackKey,
    title: template.title,
    userLevel,
    estimatedWeeks: template.estimatedWeeks,
    phases,
    progress: 0,
    milestones: phases.map((p) => p.title),
    createdAt: new Date(),
  };
}
