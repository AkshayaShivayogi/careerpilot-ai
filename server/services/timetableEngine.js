/**
 * Smart daily timetable — local scheduling with sessions, breaks, priority, energy.
 */

const SESSION_TEMPLATES = [
  { id: "morning", label: "Morning Session", emoji: "🌅", startHour: 8, startMin: 0 },
  { id: "afternoon", label: "Afternoon Session", emoji: "☀️", startHour: 14, startMin: 0 },
  { id: "evening", label: "Evening Session", emoji: "🌙", startHour: 19, startMin: 0 },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

export function formatTime12(h, m) {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${pad(m)} ${period}`;
}

function addMinutes(h, m, delta) {
  let total = h * 60 + m + delta;
  while (total < 0) total += 24 * 60;
  total = total % (24 * 60);
  return { h: Math.floor(total / 60), m: total % 60 };
}

const CATEGORY_ENERGY = {
  coding: "high",
  dsa: "high",
  debug: "high",
  theory: "medium",
  project: "medium",
  quiz: "medium",
  roadmap: "medium",
  interview: "low",
  revision: "low",
  practice: "medium",
};

const CATEGORY_PRIORITY = {
  revision: "medium",
  interview: "medium",
  theory: "medium",
  coding: "high",
  dsa: "high",
  project: "high",
  debug: "high",
  quiz: "medium",
  roadmap: "high",
};

function sessionForCategory(category, peakFocus) {
  const highEnergy = ["coding", "dsa", "debug"];
  const lowEnergy = ["revision", "interview"];
  if (peakFocus === "morning" && highEnergy.includes(category)) return "morning";
  if (peakFocus === "evening" && lowEnergy.includes(category)) return "evening";
  if (lowEnergy.includes(category)) return "evening";
  if (highEnergy.includes(category)) return "morning";
  if (category === "project") return "afternoon";
  return "afternoon";
}

/**
 * Build timetable slots from tasks — never returns empty if tasks provided.
 */
export function buildTimetable(tasks, options = {}) {
  const peakFocus = options.peakFocus || "morning";
  const breakMin = options.breakMinutes ?? 15;
  const wake = options.wakeTime || "08:00";
  const [wakeH, wakeM] = wake.split(":").map(Number);

  const safeTasks = Array.isArray(tasks) && tasks.length
    ? tasks
    : [
        {
          _id: "fallback-1",
          title: "📚 Theory review",
          category: "theory",
          estimatedMinutes: 45,
          completed: false,
        },
        {
          _id: "fallback-2",
          title: "💻 Coding practice",
          category: "coding",
          estimatedMinutes: 45,
          completed: false,
        },
      ];

  const buckets = { morning: [], afternoon: [], evening: [] };
  for (const task of safeTasks) {
    if (task.isBreak) continue;
    const cat = task.category || "roadmap";
    const sess = task.rescheduled ? "morning" : sessionForCategory(cat, peakFocus);
    buckets[sess].push({
      ...task,
      priority: task.rescheduled ? "critical" : CATEGORY_PRIORITY[cat] || "medium",
      energyLevel: CATEGORY_ENERGY[cat] || "medium",
      focusSession: ["coding", "dsa"].includes(cat),
    });
  }

  // Sort: critical/high first within each bucket
  const prioOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => (prioOrder[a.priority] ?? 2) - (prioOrder[b.priority] ?? 2));
  }

  const sessions = [];
  const allSlots = [];
  let sessionStarts = {
    morning: { h: wakeH || 8, m: wakeM || 0 },
    afternoon: { h: 14, m: 0 },
    evening: { h: 19, m: 0 },
  };

  for (const tmpl of SESSION_TEMPLATES) {
    const bucketTasks = buckets[tmpl.id];
    if (!bucketTasks.length) continue;

    let cursor = { ...sessionStarts[tmpl.id] };
    const sessionSlots = [];

    for (let i = 0; i < bucketTasks.length; i++) {
      const task = bucketTasks[i];
      const dur = Math.min(120, Math.max(20, task.estimatedMinutes || 30));
      const start = formatTime12(cursor.h, cursor.m);
      const endCursor = addMinutes(cursor.h, cursor.m, dur);
      const end = formatTime12(endCursor.h, endCursor.m);

      const slot = {
        taskId: String(task._id || task.id || `t-${i}`),
        title: task.title,
        category: task.category,
        startTime: start,
        endTime: end,
        durationMinutes: dur,
        priority: task.priority,
        energyLevel: task.energyLevel,
        completed: Boolean(task.completed),
        skipped: Boolean(task.skipped),
        isBreak: false,
        focusSession: task.focusSession,
        breakSuggestion: task.focusSession ? "Stay hydrated; phone on DND" : "",
      };
      sessionSlots.push(slot);
      allSlots.push(slot);
      cursor = endCursor;

      if (i < bucketTasks.length - 1) {
        const br = addMinutes(cursor.h, cursor.m, 0);
        const brEnd = addMinutes(br.h, br.m, breakMin);
        sessionSlots.push({
          taskId: `break-${tmpl.id}-${i}`,
          title: "☕ Break — stretch & reset",
          category: "break",
          startTime: formatTime12(br.h, br.m),
          endTime: formatTime12(brEnd.h, brEnd.m),
          durationMinutes: breakMin,
          priority: "low",
          energyLevel: "low",
          completed: false,
          skipped: false,
          isBreak: true,
          breakSuggestion: "Walk, water, eyes off screen",
          focusSession: false,
        });
        cursor = brEnd;
      }
    }

    if (sessionSlots.length) {
      sessions.push({
        id: tmpl.id,
        label: tmpl.label,
        emoji: tmpl.emoji,
        startTime: sessionSlots[0].startTime,
        endTime: sessionSlots[sessionSlots.length - 1].endTime,
        slots: sessionSlots,
      });
    }
  }

  const totalMinutes = allSlots.filter((s) => !s.isBreak).reduce((s, x) => s + x.durationMinutes, 0);
  const completed = allSlots.filter((s) => !s.isBreak && s.completed).length;
  const total = allSlots.filter((s) => !s.isBreak).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return {
    sessions,
    slots: allSlots,
    totalMinutes,
    productivityScore: Math.min(100, pct + (totalMinutes >= 120 ? 10 : 0)),
    focusScore: Math.min(
      100,
      Math.round(
        (allSlots.filter((s) => s.focusSession && s.completed).length /
          Math.max(1, allSlots.filter((s) => s.focusSession).length)) *
          100
      ) || pct
    ),
    consistencyScore: pct,
    meta: {
      peakFocus,
      generatedAt: new Date().toISOString(),
      engine: "timetable_local",
    },
  };
}

export function safeTimetableGeneration(timetable) {
  if (timetable?.sessions?.length) return timetable;
  return buildTimetable([]);
}
