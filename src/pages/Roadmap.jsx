import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api, { safeApi } from "../services/api.js";
import { getErrorMessage } from "../utils/httpError.js";
import { buildRoadmapFallback } from "../data/apiFallbacks.js";
import PageHero from "../components/premium/PageHero.jsx";
import RoadmapTimeline from "../components/roadmap/RoadmapTimeline.jsx";
import RoadmapInsights from "../components/roadmap/RoadmapInsights.jsx";
import RoadmapDependencyGraph from "../components/roadmap/RoadmapDependencyGraph.jsx";
import DailyTargetsPanel from "../components/roadmap/DailyTargetsPanel.jsx";
import DailyTimetableView from "../components/roadmap/DailyTimetableView.jsx";
import { safeRoadmapRender, safeDailyTargetGeneration, safeTimetableGeneration } from "../utils/careerSafe.js";
import { useLiveProgress } from "../hooks/useLiveProgress.js";
import ReviewPanel from "../components/roadmap/ReviewPanel.jsx";
import ExperiencePanel from "../components/roadmap/ExperiencePanel.jsx";

const TABS = [
  { id: "roadmap", label: "🛣 Roadmap" },
  { id: "daily", label: "📅 Daily targets" },
  { id: "reviews", label: "⭐ Reviews" },
  { id: "experiences", label: "👨‍💻 Experiences" },
];

export default function Roadmap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [technologies, setTechnologies] = useState([]);
  const [technology, setTechnology] = useState(searchParams.get("tech") || "React");
  const [tab, setTab] = useState(searchParams.get("tab") || "roadmap");
  const [roadmap, setRoadmap] = useState(null);
  const [progress, setProgress] = useState(null);
  const [dailyTarget, setDailyTarget] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [targetAnalytics, setTargetAnalytics] = useState(null);
  const [dailyView, setDailyView] = useState("timetable");
  const [reviews, setReviews] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [roadmapAnalytics, setRoadmapAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [legacyRoadmaps, setLegacyRoadmaps] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const { live, refresh: refreshLive } = useLiveProgress();

  useEffect(() => {
    api
      .get("/roadmap/catalog")
      .then((r) => setTechnologies(r.data?.technologies || []))
      .catch(() => setTechnologies([]));
    api
      .get("/roadmap")
      .then((r) => setLegacyRoadmaps(r.data?.roadmaps || []))
      .catch(() => setLegacyRoadmaps([]));
    api
      .get("/roadmap/analytics")
      .then((r) => setRoadmapAnalytics(r.data || null))
      .catch(() => setRoadmapAnalytics(null));
  }, []);

  const loadTech = useCallback(async (tech) => {
    setError("");
    const fb = () => buildRoadmapFallback(tech);
    const [techResult, recResult] = await Promise.all([
      safeApi.get(`/roadmap/tech/${encodeURIComponent(tech)}`, {}, { fallback: fb }),
      safeApi.get(`/roadmap/recommendations?technology=${encodeURIComponent(tech)}`, {}, {
        fallback: { recommendations: fb().recommendations },
      }),
    ]);
    const pack = techResult.data?.roadmap ? techResult.data : fb();
    setRoadmap(pack.roadmap ?? techResult.data?.roadmap);
    setProgress(pack.progress ?? techResult.data?.progress);
    setRecommendations(recResult.data?.recommendations || pack.recommendations || []);
    if (techResult.usedFallback) {
      setError("Offline roadmap — reconnect to sync progress.");
    }
  }, []);

  const loadDaily = useCallback(async (tech) => {
    setTargetsLoading(true);
    const fallback = {
      dailyTarget: {
        _id: "offline",
        technology: tech,
        tasks: [
          { _id: "t1", title: `Review ${tech} fundamentals`, completed: false },
          { _id: "t2", title: "45 min hands-on practice", completed: false },
        ],
      },
    };
    const result = await safeApi.get(
      `/daily-targets/today?technology=${encodeURIComponent(tech)}`,
      {},
      { fallback }
    );
    setDailyTarget(safeDailyTargetGeneration(result.data?.dailyTarget ?? fallback.dailyTarget));
    setTimetable(safeTimetableGeneration(result.data?.timetable));
    setTargetAnalytics(result.data?.analytics ?? null);
    if (result.usedFallback) setError("Offline daily targets — reconnect to sync.");
    setTargetsLoading(false);
  }, []);

  const loadCommunity = useCallback(async (tech) => {
    try {
      const [rev, exp, revAnalytics] = await Promise.all([
        api.get(`/reviews?technology=${encodeURIComponent(tech)}`),
        api.get(`/experiences?technology=${encodeURIComponent(tech)}`),
        api.get("/reviews/analytics"),
      ]);
      setReviews(rev.data.reviews || []);
      setExperiences(exp.data.experiences || []);
      setAnalytics(revAnalytics.data);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load community data"));
    }
  }, []);

  useEffect(() => {
    loadTech(technology);
    if (tab === "daily") loadDaily(technology);
    if (tab === "reviews" || tab === "experiences") loadCommunity(technology);
  }, [technology, tab, loadTech, loadDaily, loadCommunity]);

  function changeTech(tech) {
    setTechnology(tech);
    setSearchParams({ tech, tab });
  }

  function changeTab(next) {
    setTab(next);
    setSearchParams({ tech: technology, tab: next });
  }

  async function toggleModule(phaseIndex, module) {
    setSaving(true);
    try {
      const { data } = await api.patch(`/roadmap/tech/${encodeURIComponent(technology)}/progress`, {
        phaseIndex,
        module,
      });
      setProgress(data.progress);
      await loadTech(technology);
      if (data.live) refreshLive();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to update progress"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleDailyTask(taskId) {
    if (!dailyTarget?._id) return;
    const { data } = await api.patch(`/daily-targets/${dailyTarget._id}/tasks/${taskId}/toggle`);
    setDailyTarget(safeDailyTargetGeneration(data.dailyTarget));
    if (data.timetable) setTimetable(safeTimetableGeneration(data.timetable));
    if (data.live) refreshLive();
  }

  async function regenerateTargets() {
    const { data } = await api.post("/daily-targets/regenerate", { technology });
    setDailyTarget(safeDailyTargetGeneration(data.dailyTarget));
    if (data.timetable) setTimetable(safeTimetableGeneration(data.timetable));
    setTargetAnalytics(data.analytics ?? null);
  }

  async function completeAllTargets() {
    try {
      const { data } = await api.post("/daily-targets/complete", { technology });
    setDailyTarget(safeDailyTargetGeneration(data.dailyTarget));
    if (data.timetable) setTimetable(safeTimetableGeneration(data.timetable));
    if (data.nextDayTarget) setDailyTarget(safeDailyTargetGeneration(data.nextDayTarget));
    if (data.nextDayTimetable) setTimetable(safeTimetableGeneration(data.nextDayTimetable));
      if (data.live) refreshLive();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to complete targets"));
    }
  }

  const { roadmap: safeRoadmap, progress: safeProgress } = safeRoadmapRender(roadmap, progress);

  return (
    <div className="space-y-8">
      <PageHero
        emoji="🛣"
        title="Technology Roadmaps"
        subtitle="🚀 Premium paths: beginner → expert with live progress, salary insights, and AI daily targets."
      >
        <select className="input-field max-w-xs" value={technology} onChange={(e) => changeTech(e.target.value)}>
          {(technologies.length
            ? technologies
            : [{ technology: "React" }, { technology: "Node.js" }, { technology: "Python" }]
          ).map((t) => (
            <option key={t.technology} value={t.technology}>
              {t.icon ? `${t.icon} ` : ""}
              {t.technology}
            </option>
          ))}
        </select>
      </PageHero>

      {roadmapAnalytics && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div className="glass-card p-4">
            <p className="text-xs text-slate-500">Total learners</p>
            <p className="font-display text-2xl font-bold text-electric-400">{roadmapAnalytics.totalLearners}</p>
          </motion.div>
          <motion.div className="glass-card p-4">
            <p className="text-xs text-slate-500">Avg completion</p>
            <p className="font-display text-2xl font-bold text-emerald-400">{roadmapAnalytics.averageCompletion}%</p>
          </motion.div>
          <motion.div className="glass-card p-4">
            <p className="text-xs text-slate-500">Top reviewed</p>
            <p className="font-display text-lg font-bold">{roadmapAnalytics.topReviewedTechnology}</p>
          </motion.div>
          <motion.div className="glass-card p-4">
            <p className="text-xs text-slate-500">Most loved</p>
            <p className="font-display text-lg font-bold">{roadmapAnalytics.mostLovedRoadmap}</p>
          </motion.div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold">🔥 Recommended next</h3>
          <ul className="mt-2 space-y-2">
            {recommendations.map((r) => (
              <li key={r.name} className="text-sm text-slate-300">
                <span className="text-electric-400">{r.name}</span> — {r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => changeTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm ${
              tab === t.id ? "bg-electric-500/20 text-electric-300" : "bg-white/5 text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {live && (
        <div className="grid gap-3 sm:grid-cols-4">
          <motion.div className="glass-card p-4" layout>
            <p className="text-xs text-slate-500">⚡ Level / XP</p>
            <p className="font-display text-xl font-bold text-electric-400">
              Lv.{live.level} · {live.xp} XP
            </p>
          </motion.div>
          <motion.div className="glass-card p-4">
            <p className="text-xs text-slate-500">🎯 Productivity</p>
            <p className="font-display text-xl font-bold text-emerald-400">{live.productivityScore}%</p>
          </motion.div>
          <motion.div className="glass-card p-4">
            <p className="text-xs text-slate-500">🧠 DSA mastery</p>
            <p className="font-display text-xl font-bold text-violet-300">{live.dsa?.mastery ?? 0}%</p>
          </motion.div>
          <motion.div className="glass-card p-4">
            <p className="text-xs text-slate-500">🏆 Badges</p>
            <p className="font-display text-xl font-bold text-amber-300">
              {live.achievements?.unlocked ?? 0}/{live.achievements?.total ?? 0}
            </p>
          </motion.div>
        </div>
      )}

      {tab === "roadmap" && (
        <>
          <RoadmapInsights roadmap={safeRoadmap} />
          <RoadmapDependencyGraph graph={safeRoadmap.dependencyGraph} />
          <RoadmapTimeline
            roadmap={safeRoadmap}
            progress={safeProgress}
            onToggleModule={toggleModule}
            saving={saving}
          />
        </>
      )}

      {tab === "daily" && (
        <div className="space-y-4">
          <motion.div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDailyView("timetable")}
              className={`rounded-xl px-4 py-2 text-sm ${
                dailyView === "timetable" ? "bg-electric-500/20 text-electric-300" : "bg-white/5 text-slate-400"
              }`}
            >
              ⏰ Timetable
            </button>
            <button
              type="button"
              onClick={() => setDailyView("list")}
              className={`rounded-xl px-4 py-2 text-sm ${
                dailyView === "list" ? "bg-electric-500/20 text-electric-300" : "bg-white/5 text-slate-400"
              }`}
            >
              📋 Task list
            </button>
          </motion.div>
          {dailyView === "timetable" ? (
            <DailyTimetableView
              timetable={timetable}
              analytics={targetAnalytics}
              loading={targetsLoading}
              onToggleSlot={(taskId) => toggleDailyTask(taskId)}
              onSkipSlot={async (taskId) => {
                if (!dailyTarget?._id) return;
                const { data } = await api.patch(
                  `/daily-targets/${dailyTarget._id}/tasks/${taskId}/skip`
                );
                setDailyTarget(safeDailyTargetGeneration(data.dailyTarget));
                if (data.timetable) setTimetable(safeTimetableGeneration(data.timetable));
              }}
            />
          ) : (
            <DailyTargetsPanel
              dailyTarget={dailyTarget}
              loading={targetsLoading}
              onToggle={toggleDailyTask}
              onRegenerate={regenerateTargets}
              onCompleteAll={completeAllTargets}
            />
          )}
        </div>
      )}

      {tab === "reviews" && (
        <ReviewPanel
          technology={technology}
          reviews={reviews}
          analytics={analytics}
          onSubmit={async (payload) => {
            await api.post("/reviews", payload);
            loadCommunity(technology);
          }}
          onHelpful={async (id) => {
            await api.post(`/reviews/${id}/helpful`);
            loadCommunity(technology);
          }}
        />
      )}

      {tab === "experiences" && (
        <ExperiencePanel
          technology={technology}
          experiences={experiences}
          onSubmit={async (payload) => {
            await api.post("/experiences", payload);
            loadCommunity(technology);
          }}
        />
      )}

      {legacyRoadmaps.length > 0 && tab === "roadmap" && (
        <div className="glass-card p-5">
          <h3 className="mb-3 font-semibold">Your saved track roadmaps</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {legacyRoadmaps.map((rm) => (
              <li key={rm._id}>
                {rm.title} — {rm.progress}% complete
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
