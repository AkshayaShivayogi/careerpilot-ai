import { calcProfileCompletion } from "../utils/profileCompletion.js";
import { ResumeAnalysis } from "../models/ResumeAnalysis.js";
import { InterviewSession } from "../models/InterviewSession.js";

export async function getDashboard(req, res, next) {
  try {
    const user = req.user;
    const roadmaps = user.roadmaps || [];

    const interviewDocs = await InterviewSession.find({ userId: user._id, status: "completed" })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("technology score percentage strongTopics weakTopics readiness createdAt status");

    const interviews = interviewDocs.length ? interviewDocs : user.interviewSessions || [];

    const resumeDocs = await ResumeAnalysis.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("overallScore atsScore resumeLevel createdAt fileName resumeName");

    const interviewTrend =
      interviewDocs.length > 0
        ? [...interviewDocs].reverse().slice(-8).map((s, i) => ({
            name: `I${i + 1}`,
            score: s.score ?? s.percentage ?? 0,
          }))
        : (user.analytics?.interviewScores || []).slice(0, 8).map((s, i) => ({
            name: `I${i + 1}`,
            score: s.score,
          }));

    const techScores = {};
    for (const s of interviewDocs) {
      const t = s.technology || "Unknown";
      if (!techScores[t]) techScores[t] = { total: 0, count: 0 };
      techScores[t].total += s.score ?? s.percentage ?? 0;
      techScores[t].count += 1;
    }
    const techAvg = Object.entries(techScores).map(([name, v]) => ({
      name,
      avg: Math.round(v.total / v.count),
    }));
    const strongestTech = techAvg.length ? [...techAvg].sort((a, b) => b.avg - a.avg)[0]?.name : "—";
    const weakestTech = techAvg.length ? [...techAvg].sort((a, b) => a.avg - b.avg)[0]?.name : "—";

    const interviewAvgScore = interviewDocs.length
      ? Math.round(interviewDocs.reduce((s, i) => s + (i.score ?? i.percentage ?? 0), 0) / interviewDocs.length)
      : interviews.length
        ? Math.round(interviews.reduce((s, i) => s + (i.score || 0), 0) / interviews.length)
        : 0;

    let interviewImprovement = 0;
    if (interviewDocs.length >= 2) {
      interviewImprovement =
        (interviewDocs[0].score ?? 0) - (interviewDocs[interviewDocs.length - 1].score ?? 0);
    }

    const resumeTrend =
      resumeDocs.length > 0
        ? [...resumeDocs].reverse().slice(-8).map((r, i) => ({
            name: `R${i + 1}`,
            score: r.overallScore,
          }))
        : (user.analytics?.resumeScores || []).slice(0, 8).map((s, i) => ({
            name: `R${i + 1}`,
            score: s.score,
          }));

    const resumeAvgScore = resumeDocs.length
      ? Math.round(resumeDocs.reduce((s, r) => s + (r.overallScore || 0), 0) / resumeDocs.length)
      : 0;

    const lastResume = resumeDocs[0];
    let resumeImprovement = 0;
    if (resumeDocs.length >= 2) {
      resumeImprovement = resumeDocs[0].overallScore - resumeDocs[resumeDocs.length - 1].overallScore;
    }

    const topics = user.dsaProgress?.topics;
    const topicEntries = topics instanceof Map ? Object.fromEntries(topics) : topics || {};

    res.json({
      success: true,
      welcome: user.fullName,
      profileCompletion: calcProfileCompletion(user),
      profile: {
        fullName: user.fullName,
        targetRole: user.targetRole,
        experienceLevel: user.experienceLevel,
        profileImage: user.profileImage,
        skills: user.skills,
      },
      stats: {
        learningStreak: user.learningStreak || 0,
        roadmapProgress: roadmaps.length
          ? Math.round(roadmaps.reduce((s, r) => s + (r.progress || 0), 0) / roadmaps.length)
          : 0,
        interviewAvgScore,
        completedInterviews: interviewDocs.filter((s) => s.status === "completed").length || interviewDocs.length,
        strongestTechnology: strongestTech,
        weakestTechnology: weakestTech,
        interviewImprovement,
        dsaSolved: user.dsaProgress?.solvedCount || 0,
        dsaStreak: user.dsaProgress?.streak || 0,
        resumeAvgScore,
        totalResumeAnalyses: resumeDocs.length,
        lastResumeScore: lastResume?.overallScore ?? 0,
        lastResumeLevel: lastResume?.resumeLevel ?? "—",
        resumeImprovement,
        plannerCount: user.planners?.length || 0,
      },
      recentActivities: user.recentActivities || [],
      features: {
        resume: {
          avgScore: resumeAvgScore,
          totalAnalyses: resumeDocs.length,
          lastScore: lastResume?.overallScore ?? 0,
          lastFileName: lastResume?.resumeName || lastResume?.fileName || null,
          lastLevel: lastResume?.resumeLevel ?? null,
          improvement: resumeImprovement,
        },
        interview: {
          avgScore: interviewAvgScore,
          totalSessions: interviewDocs.length,
          completed: interviewDocs.filter((s) => s.status === "completed").length || interviewDocs.length,
          strongestTech: strongestTech,
          weakestTech: weakestTech,
          improvement: interviewImprovement,
        },
      },
      charts: {
        interviewScores: interviewTrend.length ? interviewTrend : [{ name: "—", score: 0 }],
        resumeScores: resumeTrend.length ? resumeTrend : [{ name: "—", score: 0 }],
        dsaTopics: Object.entries(topicEntries).map(([name, v]) => ({
          name,
          solved: v?.solved || 0,
          total: v?.total || 1,
        })),
        roadmapProgress: roadmaps.slice(0, 6).map((r) => ({
          name: r.title?.slice(0, 12) || r.track,
          progress: r.progress || 0,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
}
