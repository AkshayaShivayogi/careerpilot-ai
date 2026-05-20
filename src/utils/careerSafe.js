/** Failsafe render helpers — never blank sections or undefined crashes */

export function safeRoadmapRender(roadmap, progress) {
  if (!roadmap || !roadmap.phases?.length) {
    return {
      ok: false,
      roadmap: {
        technology: "React",
        title: "🚀 React Career Roadmap",
        icon: "⚛️",
        estimatedDuration: "24 weeks",
        phases: [],
        milestones: [],
        prerequisites: ["HTML", "CSS", "JavaScript"],
        trendingTechnologies: ["Next.js"],
        salaryInsights: { entry: "—", mid: "—", senior: "—" },
        hiringDemand: "High",
        careerOpportunities: ["Frontend Engineer"],
        dependencyGraph: [],
      },
      progress: progress || { progress: 0, phaseProgress: [], completedModules: [] },
    };
  }
  return {
    ok: true,
    roadmap: {
      ...roadmap,
      phases: roadmap.phases || [],
      dependencyGraph: roadmap.dependencyGraph || [],
    },
    progress: progress || { progress: 0, phaseProgress: [], completedModules: [], earnedBadges: [] },
  };
}

export function safeAnalyticsRender(data) {
  const d = data || {};
  return {
    topics: Array.isArray(d.topics) ? d.topics : [],
    solvedCount: Number(d.solvedCount) || 0,
    streak: Number(d.streak) || 0,
    completionPct: Number(d.completionPct) || 0,
    weakTopics: Array.isArray(d.weakTopics) ? d.weakTopics : [],
    strongTopics: Array.isArray(d.strongTopics) ? d.strongTopics : [],
    heatmap: Array.isArray(d.heatmap) ? d.heatmap : [],
    radar: Array.isArray(d.radar) ? d.radar : [],
  };
}

export function safeAchievementUnlock(list) {
  return (Array.isArray(list) ? list : []).map((a) => ({
    id: a.id || "unknown",
    name: a.name || "Achievement",
    icon: a.icon || "🏆",
    tier: a.tier || "bronze",
    xpReward: a.xpReward ?? 50,
    description: a.description || "",
    unlocked: Boolean(a.unlocked),
    unlockedAt: a.unlockedAt || null,
  }));
}

export function safeDailyTargetGeneration(target) {
  if (!target || !Array.isArray(target.tasks)) {
    return {
      _id: "offline",
      technology: "React",
      date: new Date().toISOString().slice(0, 10),
      tasks: [
        { _id: "f1", title: "📚 Theory review (30 min)", category: "theory", completed: false },
        { _id: "f2", title: "💻 Coding practice", category: "coding", completed: false },
      ],
      completionPercent: 0,
      streak: 0,
    };
  }
  return {
    ...target,
    tasks: target.tasks.map((t, i) => ({
      _id: t._id || `task-${i}`,
      title: t.title || "Study task",
      category: t.category || "roadmap",
      completed: Boolean(t.completed),
      estimatedMinutes: t.estimatedMinutes ?? 30,
    })),
    completionPercent: Number(target.completionPercent) || 0,
    streak: Number(target.streak) || 0,
  };
}

export function safeProgressUpdate(live) {
  if (!live) {
    return {
      xp: 0,
      level: 1,
      productivityScore: 0,
      focusScore: 0,
      consistencyLevel: "Building",
      dsa: { mastery: 0, solvedCount: 0, streak: 0, heatmap: [] },
      roadmaps: [],
      achievements: { unlocked: 0, total: 0, recent: [] },
    };
  }
  return live;
}

const FALLBACK_TIMETABLE = {
  sessions: [
    {
      id: "morning",
      label: "Morning Session",
      emoji: "🌅",
      startTime: "8:00 AM",
      endTime: "10:00 AM",
      slots: [
        {
          taskId: "f1",
          title: "📚 Theory review",
          category: "theory",
          startTime: "8:00 AM",
          endTime: "9:00 AM",
          durationMinutes: 60,
          priority: "high",
          energyLevel: "medium",
          completed: false,
          isBreak: false,
          focusSession: false,
        },
        {
          taskId: "f2",
          title: "💻 Coding practice",
          category: "coding",
          startTime: "9:15 AM",
          endTime: "10:15 AM",
          durationMinutes: 60,
          priority: "high",
          energyLevel: "high",
          completed: false,
          isBreak: false,
          focusSession: true,
        },
      ],
    },
  ],
  slots: [],
  totalMinutes: 120,
  productivityScore: 0,
  focusScore: 0,
  consistencyScore: 0,
};

export function safeTimetableGeneration(timetable) {
  if (!timetable || !Array.isArray(timetable.sessions) || !timetable.sessions.length) {
    return { ...FALLBACK_TIMETABLE, slots: FALLBACK_TIMETABLE.sessions[0].slots };
  }
  return {
    sessions: timetable.sessions.map((s) => ({
      id: s.id || "session",
      label: s.label || "Session",
      emoji: s.emoji || "⏰",
      startTime: s.startTime || "8:00 AM",
      endTime: s.endTime || "9:00 AM",
      slots: (s.slots || []).map((slot, i) => ({
        taskId: slot.taskId || `slot-${i}`,
        title: slot.title || "Study block",
        category: slot.category || "theory",
        startTime: slot.startTime || "8:00 AM",
        endTime: slot.endTime || "9:00 AM",
        durationMinutes: slot.durationMinutes ?? 30,
        priority: slot.priority || "medium",
        energyLevel: slot.energyLevel || "medium",
        completed: Boolean(slot.completed),
        skipped: Boolean(slot.skipped),
        isBreak: Boolean(slot.isBreak),
        breakSuggestion: slot.breakSuggestion || "",
        focusSession: Boolean(slot.focusSession),
      })),
    })),
    slots: timetable.slots || [],
    totalMinutes: timetable.totalMinutes ?? 0,
    productivityScore: timetable.productivityScore ?? 0,
    focusScore: timetable.focusScore ?? 0,
    consistencyScore: timetable.consistencyScore ?? 0,
  };
}

export function safeNextDayGeneration(pack) {
  return {
    dailyTarget: safeDailyTargetGeneration(pack?.dailyTarget),
    timetable: safeTimetableGeneration(pack?.timetable),
  };
}

export const TIER_EMOJI = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  legendary: "👑",
};
