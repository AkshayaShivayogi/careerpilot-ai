import { getRoadmapDefinition } from "../data/technologyRoadmapCatalog.js";
import { RoadmapProgress } from "../models/RoadmapProgress.js";
import { DailyTarget } from "../models/DailyTarget.js";
import { InterviewSession } from "../models/InterviewSession.js";
import { ensureUserDsaTopics, formatTopicsForClient } from "../data/dsaTopics.js";
import { getOrCreateContinuity, buildCurriculumSequence } from "./learningContinuityService.js";

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function calcPercent(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
}

function difficultyBand(progressPct, streak, dayIndex) {
  if (progressPct >= 70 || streak >= 14 || dayIndex >= 20) return "advanced";
  if (progressPct >= 35 || streak >= 5 || dayIndex >= 8) return "intermediate";
  return "beginner";
}

/**
 * Rule-based smart daily targets with roadmap continuity — local-first.
 */
export async function buildSmartDailyTargets(user, technology, options = {}) {
  const tech = String(technology || "React").trim();
  const date = options.date || todayKey();
  const definition = getRoadmapDefinition(tech);
  const progress = await RoadmapProgress.findOne({ userId: user._id, technology: tech });

  const continuityCtx =
    options.continuity && options.nextModule
      ? {
          continuity: options.continuity,
          nextModule: options.nextModule,
          nextNext: options.nextNext,
          dayLabel: options.dayLabel,
        }
      : await getOrCreateContinuity(user._id, tech).then((c) => ({
          continuity: c.continuity,
          nextModule: c.nextModule,
          nextNext: c.nextNext,
          dayLabel: `Day ${(c.continuity.dayIndex || 0) + 1}`,
        }));

  const { continuity, nextModule, nextNext, dayLabel } = continuityCtx;
  const dayIndex = continuity?.dayIndex ?? 0;
  const phaseIndex = progress?.currentPhaseIndex ?? continuity?.currentPhaseIndex ?? 0;
  const phase = definition.phases[phaseIndex] || definition.phases[0];
  const roadmapPct = progress?.progress ?? 0;
  const band = difficultyBand(roadmapPct, user.learningStreak || 0, dayIndex);

  ensureUserDsaTopics(user);
  const dsaTopics = formatTopicsForClient(user.dsaProgress.topics);
  const weakDsa = dsaTopics.filter((t) => t.weak || (t.solved > 0 && t.progress < 50)).slice(0, 3);

  const sessions = await InterviewSession.find({ userId: user._id, status: "completed" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  const interviewWeak = [...new Set(sessions.flatMap((s) => s.weakTopics || []))].slice(0, 2);

  const dsaFocus = weakDsa[0]?.name || phase.dsaRecommendations?.[0] || "Arrays";
  const revisionTopic = weakDsa[0] || dsaTopics.find((t) => t.needsRevision);

  const rolled = [];
  const yesterday = await DailyTarget.findOne({
    userId: user._id,
    date: yesterdayKey(),
    technology: tech,
  });
  const maxRollover = band === "beginner" ? 2 : 3;
  if (yesterday && yesterday.completionPercent < 100) {
    let count = 0;
    for (const t of yesterday.tasks) {
      if (!t.completed && count < maxRollover) {
        rolled.push({
          title: `↩️ ${t.title.replace(/^↩️\s*/, "")}`,
          category: t.category,
          completed: false,
          rescheduled: true,
          estimatedMinutes: Math.min(45, t.estimatedMinutes || 30),
          topic: nextModule,
        });
        count += 1;
      }
    }
  }

  const primary = nextModule || phase.modules[0];
  const secondary = nextNext || phase.modules[1] || primary;

  const core = [
    {
      title: `📚 ${dayLabel}: Learn ${primary}`,
      category: "theory",
      completed: false,
      estimatedMinutes: band === "advanced" ? 35 : 45,
      topic: primary,
    },
    {
      title: `💻 Coding: ${primary} exercises`,
      category: "coding",
      completed: false,
      estimatedMinutes: 50,
      topic: primary,
    },
    {
      title: `💻 Apply: ${secondary}`,
      category: "coding",
      completed: false,
      estimatedMinutes: 45,
      topic: secondary,
    },
    {
      title: `🧠 DSA: 3 ${dsaFocus} problems`,
      category: "dsa",
      completed: false,
      estimatedMinutes: 60,
      topic: dsaFocus,
    },
    revisionTopic
      ? {
          title: `🎯 Revision: ${revisionTopic.name}`,
          category: "revision",
          completed: false,
          estimatedMinutes: 30,
          topic: revisionTopic.name,
        }
      : {
          title: `🎯 Revision: ${primary} flashcards`,
          category: "revision",
          completed: false,
          estimatedMinutes: 25,
          topic: primary,
        },
    {
      title: interviewWeak.length
        ? `🔥 Interview: ${interviewWeak.join(", ")}`
        : `🔥 ${tech} mock questions (10)`,
      category: "interview",
      completed: false,
      estimatedMinutes: 40,
      topic: tech,
    },
    {
      title: phase.projects?.[0]
        ? `🚀 Project: ${phase.projects[0]}`
        : `🚀 Mini ${tech} — ${primary}`,
      category: "project",
      completed: false,
      estimatedMinutes: 55,
      topic: primary,
    },
    {
      title: `⚡ Debug: ${tech} production scenario`,
      category: "debug",
      completed: false,
      estimatedMinutes: 35,
      topic: primary,
    },
    {
      title: `🏆 Milestone check: ${phase.title}`,
      category: "roadmap",
      completed: false,
      estimatedMinutes: 20,
      topic: phase.title,
    },
  ];

  const taskCount = band === "advanced" ? 8 : band === "intermediate" ? 7 : 6;
  let tasks = [...rolled];
  const seen = new Set(rolled.map((t) => t.title));
  for (const t of core) {
    if (tasks.length >= taskCount + rolled.length) break;
    if (seen.has(t.title)) continue;
    seen.add(t.title);
    tasks.push(t);
  }

  if (roadmapPct >= 90) {
    tasks.push({
      title: "🏆 Capstone: portfolio + mock interviews",
      category: "interview",
      completed: false,
      estimatedMinutes: 60,
      topic: "capstone",
    });
  }

  const estimatedMinutes = tasks.reduce((s, t) => s + (t.estimatedMinutes || 30), 0);

  return {
    date,
    technology: tech,
    tasks,
    completionPercent: 0,
    streak: user.learningStreak || 0,
    meta: {
      phaseTitle: phase.title,
      roadmapProgress: roadmapPct,
      difficultyBand: band,
      dayIndex,
      dayLabel,
      nextModule: primary,
      nextModuleAfter: secondary,
      weakDsa: weakDsa.map((t) => t.name),
      interviewWeak,
      courseComplete: roadmapPct >= 100,
      interviewReady: roadmapPct >= 85,
      generatedAt: new Date().toISOString(),
      engine: "execution_local",
    },
    estimatedMinutes,
    productivityHint:
      estimatedMinutes > 300
        ? "Heavy day — focus on critical ↩️ and high-priority slots first."
        : `Steady ${dayLabel} pace — ${primary} then ${secondary}.`,
  };
}

export async function ensureNextDayTargets(user, technology) {
  const { safeNextDayGeneration } = await import("./dailyExecutionService.js");
  const pack = await safeNextDayGeneration(user, technology);
  return pack.dailyTarget;
}
