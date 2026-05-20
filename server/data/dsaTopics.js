/** Full DSA topic catalog — beginner → advanced */

export const DSA_TOPIC_CATALOG = [
  { slug: "arrays", label: "Arrays", level: "beginner", total: 25, difficulty: { easy: 10, medium: 10, hard: 5 } },
  { slug: "strings", label: "Strings", level: "beginner", total: 20, difficulty: { easy: 8, medium: 8, hard: 4 } },
  { slug: "hashing", label: "Hashing", level: "beginner", total: 18, difficulty: { easy: 7, medium: 8, hard: 3 } },
  { slug: "sorting", label: "Sorting", level: "beginner", total: 16, difficulty: { easy: 6, medium: 7, hard: 3 } },
  { slug: "searching", label: "Searching", level: "beginner", total: 16, difficulty: { easy: 6, medium: 7, hard: 3 } },
  { slug: "linked list", label: "Linked List", level: "beginner", total: 18, difficulty: { easy: 6, medium: 8, hard: 4 } },
  { slug: "stack", label: "Stack", level: "beginner", total: 12, difficulty: { easy: 5, medium: 5, hard: 2 } },
  { slug: "queue", label: "Queue", level: "beginner", total: 12, difficulty: { easy: 5, medium: 5, hard: 2 } },
  { slug: "recursion", label: "Recursion", level: "intermediate", total: 15, difficulty: { easy: 5, medium: 7, hard: 3 } },
  { slug: "backtracking", label: "Backtracking", level: "intermediate", total: 14, difficulty: { easy: 4, medium: 6, hard: 4 } },
  { slug: "trees", label: "Trees", level: "intermediate", total: 22, difficulty: { easy: 6, medium: 10, hard: 6 } },
  { slug: "bst", label: "BST", level: "intermediate", total: 16, difficulty: { easy: 5, medium: 7, hard: 4 } },
  { slug: "heap", label: "Heap", level: "intermediate", total: 14, difficulty: { easy: 4, medium: 6, hard: 4 } },
  { slug: "greedy", label: "Greedy", level: "intermediate", total: 14, difficulty: { easy: 5, medium: 6, hard: 3 } },
  { slug: "graphs", label: "Graphs", level: "intermediate", total: 20, difficulty: { easy: 4, medium: 10, hard: 6 } },
  { slug: "sliding window", label: "Sliding Window", level: "intermediate", total: 14, difficulty: { easy: 5, medium: 6, hard: 3 } },
  { slug: "two pointer", label: "Two Pointer", level: "intermediate", total: 14, difficulty: { easy: 5, medium: 6, hard: 3 } },
  { slug: "dp", label: "Dynamic Programming", level: "advanced", total: 18, difficulty: { easy: 3, medium: 8, hard: 7 } },
  { slug: "tries", label: "Tries", level: "advanced", total: 12, difficulty: { easy: 3, medium: 5, hard: 4 } },
  { slug: "segment trees", label: "Segment Trees", level: "advanced", total: 12, difficulty: { easy: 2, medium: 5, hard: 5 } },
  { slug: "bit manipulation", label: "Bit Manipulation", level: "advanced", total: 14, difficulty: { easy: 4, medium: 6, hard: 4 } },
  { slug: "advanced graphs", label: "Advanced Graph Algorithms", level: "advanced", total: 16, difficulty: { easy: 2, medium: 6, hard: 8 } },
  { slug: "disjoint set", label: "Disjoint Set", level: "advanced", total: 12, difficulty: { easy: 3, medium: 5, hard: 4 } },
  { slug: "monotonic stack", label: "Monotonic Stack", level: "advanced", total: 12, difficulty: { easy: 3, medium: 5, hard: 4 } },
  { slug: "topological sort", label: "Topological Sort", level: "advanced", total: 12, difficulty: { easy: 3, medium: 5, hard: 4 } },
];

export function defaultTopicProgress(topic) {
  return {
    solved: 0,
    total: topic.total,
    level: topic.level,
    label: topic.label,
    streak: 0,
    lastPracticed: null,
    difficulty: { ...topic.difficulty },
  };
}

export function ensureUserDsaTopics(user) {
  if (!user.dsaProgress) {
    user.dsaProgress = { solvedCount: 0, streak: 0, topics: new Map() };
  }
  if (!(user.dsaProgress.topics instanceof Map)) {
    const existing = user.dsaProgress.topics || {};
    user.dsaProgress.topics = new Map(Object.entries(existing));
  }
  for (const topic of DSA_TOPIC_CATALOG) {
    if (!user.dsaProgress.topics.has(topic.slug)) {
      user.dsaProgress.topics.set(topic.slug, defaultTopicProgress(topic));
    } else {
      const cur = user.dsaProgress.topics.get(topic.slug);
      user.dsaProgress.topics.set(topic.slug, {
        ...defaultTopicProgress(topic),
        ...cur,
        total: topic.total,
        level: topic.level,
        label: topic.label,
      });
    }
  }
  return user;
}

export function formatTopicsForClient(topicsMap) {
  const map = topicsMap instanceof Map ? Object.fromEntries(topicsMap) : topicsMap;
  return DSA_TOPIC_CATALOG.map((def) => {
    const t = map[def.slug] || defaultTopicProgress(def);
    const pct = t.total ? Math.round((t.solved / t.total) * 100) : 0;
    const weak = pct < 40;
    const strong = pct >= 70;
    let recommended = "Practice easy problems";
    if (weak) recommended = `Solve ${Math.max(3, Math.ceil(t.total * 0.1))} more ${def.label} problems`;
    else if (pct >= 100) recommended = "Revision: mixed contest problems";
    else recommended = `Complete ${def.total - t.solved} remaining problems`;

    return {
      slug: def.slug,
      name: def.label,
      level: def.level,
      solved: t.solved || 0,
      total: t.total || def.total,
      progress: pct,
      streak: t.streak || 0,
      weak,
      strong,
      recommended,
      needsRevision: t.solved > 0 && pct < 50 && t.lastPracticed,
      difficulty: t.difficulty || def.difficulty,
    };
  });
}
