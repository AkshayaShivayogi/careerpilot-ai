import { logActivity } from "../services/activity.js";
import { isGeminiEnabled } from "../services/geminiService.js";
import { generatePlannerPlan, buildFallbackPlanner } from "../services/plannerService.js";
import { ensurePlannerPlan, safeAnalytics } from "../services/plannerSafe.js";
import { PlannerProgress } from "../models/PlannerProgress.js";
import { resolveTechnologyName } from "../data/technologyCatalog.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";

function calcProgress(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
}

export async function plannerStatus(_req, res) {
  sendOk(res, { geminiEnabled: isGeminiEnabled() }, "Planner service ready");
}

export async function listPlanners(req, res) {
  if (!req.user) {
    return sendFail(res, "Sign in to view saved planners", 401);
  }
  sendOk(res, {
    planners: req.user.planners || [],
    geminiEnabled: isGeminiEnabled(),
  });
}

/** Public — no auth required */
export async function generatePlanner(req, res, next) {
  try {
    const technology = resolveTechnologyName(req.body.technology || req.query.technology);
    if (!technology) {
      return sendFail(res, "technology is required", 400);
    }

    const difficulty = String(
      req.body.difficulty || req.user?.experienceLevel || "medium"
    ).toLowerCase();
    const careerGoal = String(
      req.body.careerGoal ||
        req.body.career_goal ||
        req.user?.targetRole ||
        "Software Engineer"
    ).trim();
    const duration = req.body.duration ?? req.body.durationWeeks ?? "8";

    console.log("[planner] generate", { technology, difficulty, careerGoal, duration, user: req.user?._id });

    const result = await generatePlannerPlan(
      {
        technology,
        difficulty,
        careerGoal,
        durationWeeks: duration,
        targetRole: req.user?.targetRole,
        experienceLevel: req.user?.experienceLevel,
        skills: req.user?.skills,
      },
      req.user?._id ?? null
    );

    const plan = ensurePlannerPlan(
      { technology, difficulty, careerGoal, durationWeeks: duration },
      result.plan
    );

    if (req.user) {
      try {
        await PlannerProgress.findOneAndUpdate(
          { userId: req.user._id, technology },
          {
            $set: {
              planId: plan.planId,
              difficulty,
              careerGoal,
              durationWeeks: Number(duration) || 8,
              planSnapshot: plan,
              lastActive: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (saveErr) {
        console.warn("[planner] progress snapshot save failed:", saveErr.message);
      }
    }

    sendOk(
      res,
      {
        plan,
        analytics: safeAnalytics(plan, {}),
        geminiGenerated: Boolean(result.geminiGenerated),
        fallback: Boolean(result.fallback),
        geminiEnabled: isGeminiEnabled(),
      },
      result.message || "Planner generated"
    );
  } catch (e) {
    console.error("[planner] generate error", e);
    next(e);
  }
}

export async function createPlanner(req, res, next) {
  try {
    if (!req.user) {
      return sendFail(res, "Sign in to save plans to your account", 401);
    }

    const period = req.body.period === "monthly" ? "monthly" : "weekly";
    const label = String(req.body.label || "").trim();
    const focus = String(req.body.focus || req.body.technology || "general").trim();

    let tasks = Array.isArray(req.body.tasks)
      ? req.body.tasks.map((t) => ({
          title: String(t.title || t).trim(),
          completed: Boolean(t.completed),
          dueDate: t.dueDate || "",
          category: focus,
        }))
      : [];

    let geminiGenerated = false;
    let aiPlan = req.body.aiPlan || null;

    if ((req.body.useAi || req.body.fromGeneratedPlan) && !tasks.length) {
      const gen = await generatePlannerPlan(
        {
          technology: req.body.technology || focus,
          difficulty: req.body.difficulty,
          careerGoal: req.body.careerGoal,
          durationWeeks: req.body.durationWeeks,
          targetRole: req.user.targetRole,
          experienceLevel: req.user.experienceLevel,
          skills: req.user.skills,
        },
        req.user._id
      );
      aiPlan = gen.plan;
      geminiGenerated = gen.geminiGenerated;
      const merged = [
        ...(aiPlan.weekly || []).flatMap((w) => w.topics || []),
        ...(aiPlan.dailyTargets || []),
        ...(aiPlan.dsaPlan || []),
        ...(aiPlan.interviewPath || []),
      ].filter(Boolean);
      if (merged.length) {
        tasks = merged.slice(0, 30).map((title) => ({
          title: String(title).slice(0, 200),
          completed: false,
          category: focus,
        }));
      }
    }

    if (!label) return sendFail(res, "Planner label is required", 400);

    const planner = {
      period,
      label,
      focus,
      tasks,
      progress: calcProgress(tasks),
      streak: req.user.learningStreak || 0,
      aiGenerated: geminiGenerated,
      aiPlan: geminiGenerated ? aiPlan : undefined,
      createdAt: new Date(),
    };

    req.user.planners.unshift(planner);
    await req.user.save();
    await logActivity(req.user, "planner", `${period} planner created${geminiGenerated ? " (Gemini)" : ""}`);
    sendOk(
      res,
      {
        planner: req.user.planners[0],
        planners: req.user.planners,
        geminiGenerated,
        aiPlan,
      },
      "Plan saved",
      201
    );
  } catch (e) {
    next(e);
  }
}

export async function getPlannerAnalytics(req, res, next) {
  try {
    const technology = resolveTechnologyName(req.query.technology);
    if (!technology) return sendFail(res, "technology query param is required", 400);

    const difficulty = String(req.query.difficulty || "medium").toLowerCase();
    const careerGoal = String(req.query.careerGoal || "Software Engineer").trim();
    const durationWeeks = req.query.durationWeeks || req.query.duration || 8;

    let plan = buildFallbackPlanner({ technology, difficulty, careerGoal, durationWeeks });
    const progress = { streak: 0, tasks: {} };

    if (req.user) {
      const doc = await PlannerProgress.findOne({ userId: req.user._id, technology }).lean();
      if (doc?.planSnapshot?.weekly?.length) {
        plan = ensurePlannerPlan(
          { technology, difficulty, careerGoal, durationWeeks },
          doc.planSnapshot
        );
      }
      if (doc?.taskProgress) {
        progress.tasks =
          doc.taskProgress instanceof Map
            ? Object.fromEntries(doc.taskProgress)
            : doc.taskProgress;
        progress.streak = doc.streak || 0;
      }
    }

    sendOk(res, {
      analytics: safeAnalytics(plan, progress),
      planId: plan.planId,
      technology,
    });
  } catch (e) {
    next(e);
  }
}

export async function updatePlannerTask(req, res, next) {
  try {
    const taskId = String(req.body.taskId || "").trim();
    if (!taskId) return sendFail(res, "taskId is required", 400);

    const technology = resolveTechnologyName(req.body.technology);
    if (!technology) return sendFail(res, "technology is required", 400);

    const completed = Boolean(req.body.completed);
    const planSnapshot = req.body.planSnapshot;

    if (!req.user) {
      return sendOk(res, { taskId, completed, guest: true });
    }

    const update = {
      $set: {
        lastActive: new Date(),
        [`taskProgress.${taskId}`]: completed,
      },
      $push: {
        taskHistory: {
          $each: [
            {
              taskId,
              completed,
              title: String(req.body.title || "").slice(0, 200),
              at: new Date(),
            },
          ],
          $slice: -200,
        },
      },
    };

    if (completed) update.$inc = { streak: 1 };
    if (planSnapshot?.weekly?.length) {
      update.$set.planSnapshot = planSnapshot;
      update.$set.planId = planSnapshot.planId || "";
    }

    const doc = await PlannerProgress.findOneAndUpdate(
      { userId: req.user._id, technology },
      {
        ...update,
        $setOnInsert: {
          userId: req.user._id,
          technology,
          difficulty: req.body.difficulty || "medium",
          careerGoal: req.body.careerGoal || "",
        },
      },
      { upsert: true, new: true }
    ).lean();

    const progress = {
      streak: doc.streak || 0,
      tasks:
        doc.taskProgress instanceof Map
          ? Object.fromEntries(doc.taskProgress)
          : doc.taskProgress || {},
    };

    const plan = doc.planSnapshot?.weekly?.length
      ? ensurePlannerPlan({ technology }, doc.planSnapshot)
      : buildFallbackPlanner({ technology });

    sendOk(res, {
      taskId,
      completed,
      analytics: safeAnalytics(plan, progress),
      progress: { streak: progress.streak, taskCount: Object.keys(progress.tasks).length },
    });
  } catch (e) {
    next(e);
  }
}

export async function regeneratePlanner(req, res, next) {
  return generatePlanner(req, res, next);
}

export async function toggleTask(req, res, next) {
  try {
    if (!req.user) return sendFail(res, "Authentication required", 401);
    const { plannerId, taskId } = req.params;
    const planner = req.user.planners.id(plannerId);
    if (!planner) return sendFail(res, "Planner not found", 404);
    const task = planner.tasks.id(taskId);
    if (!task) return sendFail(res, "Task not found", 404);
    task.completed = !task.completed;
    planner.progress = calcProgress(planner.tasks);
    if (task.completed) req.user.learningStreak = (req.user.learningStreak || 0) + 1;
    await req.user.save();
    await logActivity(req.user, "planner", task.completed ? "Task completed" : "Task reopened");
    sendOk(res, { planner, planners: req.user.planners });
  } catch (e) {
    next(e);
  }
}
