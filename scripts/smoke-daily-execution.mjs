/**
 * Daily execution engine smoke (no Mongo required for timetable build).
 */
import { buildTimetable, safeTimetableGeneration } from "../server/services/timetableEngine.js";
import { buildCurriculumSequence } from "../server/services/learningContinuityService.js";

let failed = 0;

const tasks = [
  { _id: "1", title: "📚 Learn React Hooks", category: "theory", estimatedMinutes: 60 },
  { _id: "2", title: "💻 DSA Arrays x3", category: "dsa", estimatedMinutes: 60 },
  { _id: "3", title: "🚀 Mini project", category: "project", estimatedMinutes: 90 },
  { _id: "4", title: "🧠 Revision", category: "revision", estimatedMinutes: 45 },
];

const tt = buildTimetable(tasks, { peakFocus: "morning", wakeTime: "08:00" });

if (!tt.sessions.length) {
  console.log("FAIL timetable has no sessions");
  failed++;
} else {
  console.log(`OK  timetable ${tt.sessions.length} sessions, ${tt.slots.length} slots`);
}

const morning = tt.sessions.find((s) => s.id === "morning");
if (!morning?.slots.some((s) => s.startTime.includes("AM"))) {
  console.log("FAIL morning times missing");
  failed++;
} else {
  console.log("OK  morning session scheduled");
}

const safe = safeTimetableGeneration(null);
if (!safe.sessions.length) {
  console.log("FAIL safe timetable empty");
  failed++;
} else {
  console.log("OK  safe timetable fallback");
}

const reactCurriculum = buildCurriculumSequence("React");
if (!reactCurriculum.some((m) => /hook|jsx|component/i.test(m))) {
  console.log("FAIL React curriculum sequence");
  failed++;
} else {
  console.log(`OK  React curriculum ${reactCurriculum.length} modules`);
}

const breaks = tt.sessions.flatMap((s) => s.slots).filter((s) => s.isBreak);
if (breaks.length < 1) {
  console.log("FAIL no breaks inserted");
  failed++;
} else {
  console.log(`OK  ${breaks.length} breaks scheduled`);
}

console.log(failed ? `\nDaily execution smoke: ${failed} failed` : "\nDaily execution smoke: all passed");
process.exit(failed > 0 ? 1 : 0);
