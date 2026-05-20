import crypto from "crypto";
import { getRoadmapDefinition } from "../data/technologyRoadmapCatalog.js";
import { LearningContinuity } from "../models/LearningContinuity.js";
import { RoadmapProgress } from "../models/RoadmapProgress.js";
import { CompletionHistory } from "../models/CompletionHistory.js";

export function taskHash(title) {
  return crypto.createHash("md5").update(String(title).toLowerCase().trim()).digest("hex").slice(0, 16);
}

/** Flat ordered curriculum modules for a technology */
export function buildCurriculumSequence(technology) {
  const def = getRoadmapDefinition(technology);
  const modules = [];
  for (const phase of def.phases || []) {
    for (const mod of phase.modules || []) {
      if (mod && !modules.includes(mod)) modules.push(mod);
    }
  }
  return modules.length ? modules : [`${technology} fundamentals`, `${technology} patterns`, `${technology} projects`];
}

export async function getOrCreateContinuity(userId, technology) {
  const tech = String(technology || "React").trim();
  let doc = await LearningContinuity.findOne({ userId, technology: tech });
  const progress = await RoadmapProgress.findOne({ userId, technology: tech });
  const curriculum = buildCurriculumSequence(tech);

  if (!doc) {
    doc = await LearningContinuity.create({
      userId,
      technology: tech,
      dayIndex: 0,
      currentPhaseIndex: progress?.currentPhaseIndex ?? 0,
      currentModule: curriculum[0] || "",
      completedTopics: [...(progress?.completedModules || [])],
    });
  }

  const completedSet = new Set([
    ...(doc.completedTopics || []),
    ...(progress?.completedModules || []),
  ]);

  const nextModule =
    curriculum.find((m) => !completedSet.has(m)) ||
    curriculum[Math.min(doc.dayIndex, curriculum.length - 1)] ||
    curriculum[0];

  const nextNext =
    curriculum.find((m) => m !== nextModule && !completedSet.has(m)) || curriculum[1] || nextModule;

  return {
    continuity: doc,
    curriculum,
    nextModule,
    nextNext,
    completedSet,
    phaseIndex: progress?.currentPhaseIndex ?? doc.currentPhaseIndex ?? 0,
    roadmapProgress: progress?.progress ?? 0,
  };
}

/** Advance day after full completion */
export async function advanceContinuity(userId, technology, completedTasks = []) {
  const { continuity, curriculum, nextModule } = await getOrCreateContinuity(userId, technology);
  const hashes = new Set(continuity.completedTaskHashes || []);

  for (const t of completedTasks) {
    if (t.title) hashes.add(taskHash(t.title));
    if (t.topic) continuity.completedTopics.push(t.topic);
  }

  if (nextModule && !continuity.completedTopics.includes(nextModule)) {
    continuity.completedTopics.push(nextModule);
  }

  continuity.dayIndex = (continuity.dayIndex || 0) + 1;
  continuity.currentModule = curriculum[continuity.dayIndex % curriculum.length] || nextModule;
  continuity.lastCompletedDate = new Date().toISOString().slice(0, 10);
  continuity.completedTaskHashes = [...hashes].slice(-200);

  const roadmapPct = (await RoadmapProgress.findOne({ userId, technology }))?.progress ?? 0;
  continuity.courseComplete = roadmapPct >= 100;
  continuity.interviewReady = roadmapPct >= 85;
  await continuity.save();
  return continuity;
}

export function pickDayTopics(continuity, curriculum, dayIndex) {
  const idx = dayIndex % curriculum.length;
  const primary = curriculum[idx];
  const secondary = curriculum[(idx + 1) % curriculum.length];
  return { primary, secondary, dayLabel: `Day ${dayIndex + 1}` };
}

export async function recordCompletionHistory(userId, technology, dailyTarget, analytics = {}) {
  const date = dailyTarget.date;
  const tasks = dailyTarget.tasks || [];
  const completed = tasks.filter((t) => t.completed).length;
  const studyMinutes = tasks.reduce((s, t) => s + (t.completed ? t.estimatedMinutes || 30 : 0), 0);

  return CompletionHistory.findOneAndUpdate(
    { userId, date, technology },
    {
      userId,
      date,
      technology,
      tasksTotal: tasks.length,
      tasksCompleted: completed,
      completionPercent: dailyTarget.completionPercent ?? 0,
      studyMinutes,
      productivityScore: analytics.productivityScore ?? 0,
      focusScore: analytics.focusScore ?? 0,
      skippedCount: analytics.skippedCount ?? 0,
    },
    { upsert: true, new: true }
  );
}
