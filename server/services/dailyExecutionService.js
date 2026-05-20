import { DailyTarget } from "../models/DailyTarget.js";
import { DailyTimetable } from "../models/DailyTimetable.js";
import { TaskProgress } from "../models/TaskProgress.js";
import { UserSchedule } from "../models/UserSchedule.js";
import { LearningStats } from "../models/LearningStats.js";
import { buildSmartDailyTargets, todayKey, tomorrowKey, calcPercent } from "./advancedDailyTargetEngine.js";
import { buildTimetable, safeTimetableGeneration } from "./timetableEngine.js";
import {
  getOrCreateContinuity,
  advanceContinuity,
  recordCompletionHistory,
  taskHash,
} from "./learningContinuityService.js";
import { ensureLearningStats, updateProgress } from "./careerEcosystemService.js";

export { todayKey, tomorrowKey, calcPercent };

export async function getUserSchedulePrefs(userId) {
  let s = await UserSchedule.findOne({ userId });
  if (!s) {
    s = await UserSchedule.create({ userId });
  }
  return s;
}

function dedupeTasks(tasks, hashSet = new Set()) {
  const out = [];
  for (const t of tasks) {
    const h = taskHash(t.title);
    if (hashSet.has(h)) continue;
    hashSet.add(h);
    out.push(t);
  }
  return out.length ? out : tasks.slice(0, 3);
}

/** Full daily pack: targets + timetable + continuity */
export async function generateDailyExecution(user, technology, options = {}) {
  const tech = String(technology || "React").trim();
  const date = options.date || todayKey();
  const { continuity, nextModule, nextNext, dayLabel, roadmapProgress } = await loadContinuityContext(
    user._id,
    tech
  );

  const payload = await buildSmartDailyTargets(user, tech, {
    date,
    continuity,
    nextModule,
    nextNext,
    dayLabel,
  });

  payload.tasks = dedupeTasks(payload.tasks, new Set(continuity.completedTaskHashes || []));

  const schedule = await getUserSchedulePrefs(user._id);
  const timetableData = buildTimetable(
    payload.tasks.map((t, i) => ({ ...t, _id: t._id || `gen-${i}` })),
    {
      peakFocus: schedule.peakFocus,
      breakMinutes: schedule.breakMinutes,
      wakeTime: schedule.wakeTime,
    }
  );

  const dailyTarget = await DailyTarget.findOneAndUpdate(
    { userId: user._id, date, technology: tech },
    {
      $set: {
        ...payload,
        userId: user._id,
        meta: {
          ...payload.meta,
          dayIndex: continuity.dayIndex,
          dayLabel,
          nextModule,
          roadmapProgress,
        },
      },
    },
    { upsert: true, new: true }
  );

  const timetable = await DailyTimetable.findOneAndUpdate(
    { userId: user._id, date, technology: tech },
    {
      $set: {
        userId: user._id,
        dailyTargetId: dailyTarget._id,
        date,
        technology: tech,
        ...timetableData,
      },
    },
    { upsert: true, new: true }
  );

  await syncTaskProgress(user._id, dailyTarget, timetable);

  return { dailyTarget, timetable, continuity };
}

async function loadContinuityContext(userId, technology) {
  const { continuity, nextModule, nextNext, roadmapProgress } = await getOrCreateContinuity(
    userId,
    technology
  );
  const dayLabel = `Day ${(continuity.dayIndex || 0) + 1}`;
  return { continuity, nextModule, nextNext, dayLabel, roadmapProgress };
}

async function syncTaskProgress(userId, dailyTarget, timetable) {
  const slots = timetable.slots?.filter((s) => !s.isBreak) || [];
  for (const slot of slots) {
    await TaskProgress.findOneAndUpdate(
      { userId, dailyTargetId: dailyTarget._id, taskId: slot.taskId },
      {
        userId,
        dailyTargetId: dailyTarget._id,
        taskId: slot.taskId,
        date: dailyTarget.date,
        technology: dailyTarget.technology,
        title: slot.title,
        category: slot.category,
        scheduledStart: slot.startTime,
        scheduledEnd: slot.endTime,
        status: slot.completed ? "completed" : slot.skipped ? "skipped" : "pending",
      },
      { upsert: true }
    );
  }
}

export async function getTimetableForUser(userId, technology, date = todayKey()) {
  const tech = String(technology || "React").trim();
  let timetable = await DailyTimetable.findOne({ userId, date, technology: tech }).lean();
  let dailyTarget = await DailyTarget.findOne({ userId, date, technology: tech });

  if (!dailyTarget) {
    const user = await import("../models/User.js").then((m) => m.User.findById(userId));
    if (!user) return safeTimetableGeneration(null);
    const pack = await generateDailyExecution(user, tech, { date });
    return pack;
  }

  if (!timetable || !timetable.sessions?.length) {
    const schedule = await getUserSchedulePrefs(userId);
    const built = buildTimetable(dailyTarget.tasks, {
      peakFocus: schedule.peakFocus,
      breakMinutes: schedule.breakMinutes,
      wakeTime: schedule.wakeTime,
    });
    timetable = await DailyTimetable.findOneAndUpdate(
      { userId, date, technology: tech },
      { $set: { ...built, userId, dailyTargetId: dailyTarget._id, date, technology: tech } },
      { upsert: true, new: true }
    ).lean();
  }

  const stats = await ensureLearningStats(userId);
  return {
    dailyTarget,
    timetable: safeTimetableGeneration(timetable),
    analytics: {
      productivityScore: timetable.productivityScore ?? stats.productivityScore,
      focusScore: timetable.focusScore ?? stats.focusScore,
      consistencyScore: timetable.consistencyScore ?? 0,
      studyMinutes: dailyTarget.estimatedMinutes || 0,
      completionPercent: dailyTarget.completionPercent ?? 0,
      streak: dailyTarget.streak ?? 0,
    },
  };
}

export async function safeNextDayGeneration(user, technology) {
  const tech = String(technology || "React").trim();
  const nextDate = tomorrowKey();

  const existing = await DailyTarget.findOne({ userId: user._id, date: nextDate, technology: tech });
  if (existing?.tasks?.length) {
    const timetable = await getTimetableForUser(user._id, tech, nextDate);
    return timetable;
  }

  const today = await DailyTarget.findOne({ userId: user._id, date: todayKey(), technology: tech });
  if (today?.completionPercent >= 100) {
    await advanceContinuity(
      user._id,
      tech,
      today.tasks.filter((t) => t.completed).map((t) => ({ title: t.title, topic: t.topic }))
    );
  }

  return generateDailyExecution(user, tech, { date: nextDate });
}

export async function completeDayAndPlanNext(user, technology) {
  const tech = String(technology || "React").trim();
  const date = todayKey();
  const doc = await DailyTarget.findOne({ userId: user._id, date, technology: tech });
  if (!doc) {
    return generateDailyExecution(user, tech);
  }

  for (const task of doc.tasks) task.completed = true;
  doc.completionPercent = 100;
  await doc.save();

  await advanceContinuity(
    user._id,
    tech,
    doc.tasks.map((t) => ({ title: t.title }))
  );

  const timetable = await DailyTimetable.findOne({ userId: user._id, date, technology: tech });
  if (timetable) {
    for (const slot of timetable.slots || []) {
      if (!slot.isBreak) slot.completed = true;
    }
    timetable.productivityScore = 100;
    await timetable.save();
  }

  await recordCompletionHistory(user._id, tech, doc, {
    productivityScore: 100,
    focusScore: 100,
  });

  const stats = await ensureLearningStats(user._id);
  stats.taskStreak = (stats.taskStreak || 0) + 1;
  stats.lastTargetDate = date;
  await stats.save();

  const nextPack = await safeNextDayGeneration(user, tech);
  const live = await updateProgress(user._id, {
    type: "task_complete",
    technology: tech,
    taskTitle: "Daily execution complete",
    xp: 50,
  });

  return {
    dailyTarget: doc,
    timetable,
    nextDayTarget: nextPack.dailyTarget,
    nextDayTimetable: nextPack.timetable,
    live: live?.live,
  };
}

export async function toggleTaskWithTimetable(user, dailyTargetId, taskId) {
  const doc = await DailyTarget.findOne({ _id: dailyTargetId, userId: user._id });
  if (!doc) return null;

  const task = doc.tasks.id(taskId);
  if (!task) return null;

  task.completed = !task.completed;
  doc.completionPercent = calcPercent(doc.tasks);

  const timetable = await DailyTimetable.findOne({
    userId: user._id,
    date: doc.date,
    technology: doc.technology,
  });

  if (timetable) {
    for (const slot of timetable.slots || []) {
      if (slot.taskId === String(taskId)) slot.completed = task.completed;
    }
    for (const sess of timetable.sessions || []) {
      for (const slot of sess.slots || []) {
        if (slot.taskId === String(taskId)) slot.completed = task.completed;
      }
    }
    const work = timetable.slots.filter((s) => !s.isBreak);
    const done = work.filter((s) => s.completed).length;
    timetable.productivityScore = work.length ? Math.round((done / work.length) * 100) : 0;
    timetable.focusScore = timetable.productivityScore;
    await timetable.save();
  }

  await TaskProgress.findOneAndUpdate(
    { userId: user._id, dailyTargetId: doc._id, taskId: String(taskId) },
    { status: task.completed ? "completed" : "pending", completedAt: task.completed ? new Date() : null },
    { upsert: true }
  );

  if (doc.completionPercent >= 100) {
    await advanceContinuity(user._id, doc.technology, doc.tasks.filter((t) => t.completed));
    await safeNextDayGeneration(user, doc.technology);
  }

  await doc.save();
  const live = await updateProgress(user._id, {
    type: "task_complete",
    technology: doc.technology,
    taskTitle: task.title,
    category: task.category,
    xp: task.completed ? 15 : 0,
  });

  return { dailyTarget: doc, timetable, live: live?.live };
}

export async function skipTask(user, dailyTargetId, taskId) {
  const doc = await DailyTarget.findOne({ _id: dailyTargetId, userId: user._id });
  if (!doc) return null;
  const task = doc.tasks.id(taskId);
  if (!task) return null;

  const timetable = await DailyTimetable.findOne({
    userId: user._id,
    date: doc.date,
    technology: doc.technology,
  });
  if (timetable) {
    for (const slot of timetable.slots || []) {
      if (slot.taskId === String(taskId)) {
        slot.skipped = true;
        slot.completed = false;
      }
    }
    await timetable.save();
  }

  await TaskProgress.findOneAndUpdate(
    { userId: user._id, dailyTargetId: doc._id, taskId: String(taskId) },
    { status: "skipped" },
    { upsert: true }
  );

  const live = await updateProgress(user._id, { type: "task_skip", technology: doc.technology });
  return { dailyTarget: doc, timetable, live: live?.live };
}
