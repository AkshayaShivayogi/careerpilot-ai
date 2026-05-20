/** Status badges for planner UI — plan content is Gemini-generated via API */
export { PLANNER_TECH_LIST, PLANNER_DIFFICULTIES, PLANNER_DURATIONS, PLANNER_CAREER_GOALS } from "./plannerTechList.js";

export const STATUS_META = {
  completed: { label: "Completed", icon: "✅", className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  in_progress: { label: "In Progress", icon: "🟡", className: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  locked: { label: "Locked", icon: "🔒", className: "text-slate-500 border-slate-600/30 bg-slate-800/40" },
  upcoming: { label: "Upcoming", icon: "🚀", className: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
};
