import { User } from "../models/User.js";
import { todayKey } from "../services/advancedDailyTargetEngine.js";
import {
  generateDailyExecution,
  getTimetableForUser,
  completeDayAndPlanNext,
  toggleTaskWithTimetable,
  skipTask,
  safeNextDayGeneration,
} from "../services/dailyExecutionService.js";

export async function getTodayTargets(req, res, next) {
  try {
    const technology = String(req.query.technology || "React").trim();
    const pack = await getTimetableForUser(req.user._id, technology, todayKey());
    res.json({
      dailyTarget: pack.dailyTarget,
      timetable: pack.timetable,
      analytics: pack.analytics,
    });
  } catch (e) {
    next(e);
  }
}

export async function getTimetable(req, res, next) {
  try {
    const technology = String(req.query.technology || "React").trim();
    const date = String(req.query.date || todayKey());
    const pack = await getTimetableForUser(req.user._id, technology, date);
    res.json(pack);
  } catch (e) {
    next(e);
  }
}

export async function generateTargets(req, res, next) {
  try {
    const technology = String(req.body.technology || req.query.technology || "React").trim();
    const date = String(req.body.date || todayKey());
    const pack = await generateDailyExecution(req.user, technology, { date });
    res.json(pack);
  } catch (e) {
    next(e);
  }
}

export async function regenerateToday(req, res, next) {
  try {
    const technology = String(req.body.technology || req.query.technology || "React").trim();
    const pack = await generateDailyExecution(req.user, technology);
    res.json(pack);
  } catch (e) {
    next(e);
  }
}

export async function generateNextDay(req, res, next) {
  try {
    const technology = String(req.body.technology || "React").trim();
    const pack = await safeNextDayGeneration(req.user, technology);
    res.json(pack);
  } catch (e) {
    next(e);
  }
}

export async function completeDailyTargets(req, res, next) {
  try {
    const technology = String(req.body.technology || "React").trim();
    const user = await User.findById(req.user._id);
    if (user) {
      user.learningStreak = (user.learningStreak || 0) + 1;
      await user.save();
    }
    const result = await completeDayAndPlanNext(req.user, technology);
    res.json({
      dailyTarget: result.dailyTarget,
      timetable: result.timetable,
      nextDayTarget: result.nextDayTarget,
      nextDayTimetable: result.nextDayTimetable,
      live: result.live,
      achievementsUnlocked: 0,
    });
  } catch (e) {
    next(e);
  }
}

export async function toggleTargetTask(req, res, next) {
  try {
    const { id, taskId } = req.params;
    const result = await toggleTaskWithTimetable(req.user, id, taskId);
    if (!result) return res.status(404).json({ message: "Task not found" });

    res.json({
      dailyTarget: result.dailyTarget,
      timetable: result.timetable,
      live: result.live,
      achievementsUnlocked: 0,
    });
  } catch (e) {
    next(e);
  }
}

export async function skipTargetTask(req, res, next) {
  try {
    const { id, taskId } = req.params;
    const result = await skipTask(req.user, id, taskId);
    if (!result) return res.status(404).json({ message: "Task not found" });
    res.json(result);
  } catch (e) {
    next(e);
  }
}
