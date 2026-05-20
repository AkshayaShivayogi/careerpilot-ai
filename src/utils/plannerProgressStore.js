const STORAGE_KEY = "careerpilot_planner_progress_v1";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function loadProgress(technology) {
  const tech = String(technology || "React");
  const entry = readAll()[tech];
  return {
    tasks: entry?.tasks || {},
    streak: entry?.streak || 0,
    planId: entry?.planId || "",
    updatedAt: entry?.updatedAt || null,
  };
}

export function saveTaskProgress(technology, taskId, completed, extras = {}) {
  const tech = String(technology || "React");
  const all = readAll();
  const prev = all[tech] || { tasks: {}, streak: 0 };
  const tasks = { ...prev.tasks, [taskId]: Boolean(completed) };
  const streak = completed ? (prev.streak || 0) + 1 : prev.streak || 0;
  all[tech] = {
    ...prev,
    tasks,
    streak,
    planId: extras.planId || prev.planId,
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
  return all[tech];
}

export function applyProgressToPlan(plan, progress) {
  if (!plan?.weekly?.length) return plan;
  const tasks = progress?.tasks || {};
  const weekly = plan.weekly.map((week) => {
    const days = (week.days || []).map((day) => ({
      ...day,
      tasks: (day.tasks || []).map((t) => ({
        ...t,
        completed: Boolean(t.completed || tasks[t.id]),
      })),
    }));
    let done = 0;
    let total = 0;
    days.forEach((d) => {
      d.tasks.forEach((t) => {
        total += 1;
        if (t.completed) done += 1;
      });
    });
    return {
      ...week,
      days,
      completionPct: total ? Math.round((done / total) * 100) : week.completionPct || 0,
    };
  });
  return { ...plan, weekly };
}
