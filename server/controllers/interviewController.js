import { InterviewQuestion } from "../models/InterviewQuestion.js";
import { InterviewSession } from "../models/InterviewSession.js";
import { User } from "../models/User.js";
import { logActivity } from "../services/activity.js";
import { listTechnologies } from "../services/interviewEngine.js";
import { isGeminiEnabled } from "../services/geminiService.js";
import { isGeminiEnhanceEnabled } from "../config/aiMode.js";
import { scoreAnswerLocally } from "../services/localInterviewScoring.js";
import {
  sameQuestionId,
  findQuestionInSession,
  findQuestionIndex,
  normalizeSessionQuestions,
  syncAnsweredFlags,
} from "../services/interviewSessionUtils.js";
import {
  createInterviewSessionRecord,
  loadInterviewSession,
  persistInterviewSession,
  toClientSession,
  isGuestSessionId,
} from "../services/interviewSessionBridge.js";
import { countForTechnology, CORE_TECHNOLOGIES } from "../services/questionSeed.js";
import { getCoreTechnologies, getMasterTechnologies, resolveTechnologyName } from "../data/technologyCatalog.js";
import {
  safeGenerateQuestions,
  safeNextQuestion,
  safeRestoreSession,
  safeScoreCalculation,
  buildInterviewAnalytics,
} from "../services/interviewSafe.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";

function buildResultPayload({
  isCorrect,
  aiEvaluation,
  explanation,
  correctAnswer,
  improvementTip,
  qMeta,
  completed,
  session,
  alreadyAnswered = false,
}) {
  return {
    isCorrect,
    alreadyAnswered,
    score: aiEvaluation?.score,
    strengths: aiEvaluation?.strengths,
    weaknesses: aiEvaluation?.weaknesses,
    improvementTips: aiEvaluation?.improvementTips,
    idealAnswer: aiEvaluation?.idealAnswer || correctAnswer,
    communicationRating: aiEvaluation?.communicationRating,
    confidenceRating: aiEvaluation?.confidenceRating,
    speechAnalysisNote: aiEvaluation?.speechAnalysisNote,
    explanation,
    correctAnswer,
    improvementTip,
    whyItMatters: qMeta?.whyItMatters || "",
    realWorldExample: qMeta?.realWorldExample || "",
    commonMistake: qMeta?.commonMistake || "",
    interviewTip: qMeta?.interviewTip || aiEvaluation?.improvementTips?.[0] || "",
    codeSnippet: qMeta?.codeSnippet || "",
    timeComplexity: qMeta?.timeComplexity || "",
    spaceComplexity: qMeta?.spaceComplexity || "",
    completed,
    aiFeedback: session?.aiFeedback || null,
    geminiEvaluated: false,
    currentQuestionIndex: session?.currentQuestionIndex ?? -1,
  };
}

export async function listStreams(_req, res) {
  try {
    const dbStreams = await InterviewQuestion.distinct("stream");
    const merged = [
      ...new Set([...getMasterTechnologies(), ...CORE_TECHNOLOGIES, ...listTechnologies(), ...dbStreams]),
    ].sort();
    const counts = {};
    for (const t of getCoreTechnologies()) {
      counts[t] = await countForTechnology(t).catch(() => 0);
    }
    sendOk(res, {
      streams: merged,
      technologies: merged,
      coreTechnologies: getCoreTechnologies(),
      questionCounts: counts,
      geminiEnabled: isGeminiEnabled(),
    });
  } catch (e) {
    console.error("[interview] listStreams", e);
    sendOk(res, { technologies: getMasterTechnologies(), geminiEnabled: isGeminiEnabled() });
  }
}

export async function generateInterview(req, res, next) {
  try {
    const technology = resolveTechnologyName(req.body.technology || req.body.stream);
    const difficulty = String(req.body.difficulty || "medium").toLowerCase();
    const count = Math.min(20, Math.max(5, Number(req.body.count || req.body.questionCount) || 10));
    const styles = Array.isArray(req.body.styles) ? req.body.styles : [];
    const userId = req.user?._id ?? null;

    if (!technology) {
      return sendFail(res, "Technology is required", 400);
    }

    console.log("[interview] generate", { technology, difficulty, count, userId: userId?.toString() || "guest" });

    const geminiGenerated = false;
    const { questions, source } = await safeGenerateQuestions({
      technology,
      difficulty,
      count,
      styles,
    });

    const maxPoints = questions.reduce((s, q) => s + (q.points || 10), 0);

    const session = await createInterviewSessionRecord(userId, {
      technology,
      difficulty,
      questionCount: questions.length,
      totalQuestions: questions.length,
      questions,
      maxPoints,
      answers: [],
      status: "active",
      aiGenerated: geminiGenerated,
      questionSource: source,
    });

    if (req.user) {
      await logActivity(req.user, "interview", `Interview started: ${technology} (${difficulty}) [${source}]`);
    }

    const clientSession = toClientSession(session);

    sendOk(
      res,
      {
        session: clientSession,
        geminiGenerated,
        questionSource: source,
        isGuest: !userId,
      },
      "Interview session created",
      201
    );
  } catch (e) {
    console.error("[interview] generate error", e);
    next(e);
  }
}

export async function submitAnswer(req, res, next) {
  try {
    const sessionId = req.body.sessionId || req.params.id;
    const { questionId, answer, selectedOption } = req.body;
    const userAnswer = String(answer ?? selectedOption ?? "").trim();
    const durationSec = Number(req.body.durationSec);
    const userId = req.user?._id ?? null;

    if (!sessionId || questionId == null || questionId === "") {
      return sendFail(res, "sessionId and questionId are required", 400);
    }

    let session = await loadInterviewSession(sessionId, userId);
    if (!session) {
      return sendFail(res, "Session not found", 404);
    }

    if (session.status === "completed") {
      return sendFail(res, "Session already completed", 400);
    }

    syncAnsweredFlags(session);

    const qId = String(questionId);
    const existingAnswer = (session.answers || []).find((a) => sameQuestionId(a.questionId, qId));

    if (existingAnswer) {
      syncAnsweredFlags(session);
      const qMeta = findQuestionInSession(session, qId);
      const clientSession = toClientSession(session);
      return sendOk(res, {
        session: clientSession,
        alreadyAnswered: true,
        result: buildResultPayload({
          isCorrect: existingAnswer.isCorrect,
          aiEvaluation: null,
          explanation: existingAnswer.explanation,
          correctAnswer: existingAnswer.correctAnswer,
          improvementTip: existingAnswer.improvementTip,
          qMeta,
          completed: session.status === "completed",
          session: clientSession,
          alreadyAnswered: true,
        }),
      });
    }

    let qMeta = findQuestionInSession(session, qId);
    if (!qMeta) {
      const expectedIndex = session.answers?.length || 0;
      qMeta = session.questions?.[expectedIndex];
    }
    if (!qMeta) {
      return sendFail(res, "Question not found", 404);
    }

    const canonicalId = String(qMeta.id);

    let qForScore = { ...qMeta };
    const dbQ = await InterviewQuestion.findById(canonicalId).catch(() => null);
    if (dbQ) {
      qForScore = {
        ...qForScore,
        correctAnswer: dbQ.correctAnswer || qForScore.correctAnswer,
        explanation: dbQ.explanation || qForScore.explanation,
        options: dbQ.options?.length ? dbQ.options : qForScore.options,
        realWorldExample: dbQ.realWorldExample || qForScore.realWorldExample,
        commonMistake: dbQ.commonMistake || qForScore.commonMistake,
        interviewTip: dbQ.interviewTip || qForScore.interviewTip,
        type: dbQ.type || qForScore.type,
      };
    }

    const local = scoreAnswerLocally(qForScore, userAnswer);
    let isCorrect = local.isCorrect;
    let points = local.points;
    const topic = qMeta.topic || qMeta.category || "general";
    let improvementTip = local.improvementTip;
    let explanation = local.explanation || qMeta.explanation || "";
    let correctAnswer = local.correctAnswer || qMeta.correctAnswer || "";
    const aiEvaluation = {
      score: local.score,
      isCorrect: local.isCorrect,
      strengths: local.strengths,
      weaknesses: local.weaknesses,
      improvementTips: local.improvementTips,
      idealAnswer: local.idealAnswer,
      communicationRating: local.communicationRating,
      confidenceRating: local.confidenceRating,
    };

    if (!session.answers) session.answers = [];
    session.answers.push({
      questionId: canonicalId,
      answer: userAnswer,
      isCorrect,
      points,
      correctAnswer,
      explanation,
      improvementTip,
      topic,
      aiScore: aiEvaluation?.score,
      communicationRating: aiEvaluation?.communicationRating,
      confidenceRating: aiEvaluation?.confidenceRating,
    });

    const qIdx = findQuestionIndex(session, canonicalId);
    if (qIdx >= 0 && session.questions) {
      session.questions[qIdx] = {
        ...session.questions[qIdx],
        id: canonicalId,
        answered: true,
        isCorrect,
        userAnswer,
        locked: true,
      };
    }

    if (isCorrect) {
      session.strongTopics = [...new Set([...(session.strongTopics || []), topic])].slice(0, 12);
    } else {
      session.weakTopics = [...new Set([...(session.weakTopics || []), topic])].slice(0, 12);
    }

    if (durationSec > 0) session.durationSec = durationSec;

    let completed = false;
    if (session.answers.length >= (session.questions?.length || 0)) {
      safeScoreCalculation(session);
      completed = true;

      if (userId) {
        await User.updateOne(
          { _id: userId },
          {
            $push: {
              interviewSessions: {
                $each: [
                  {
                    stream: session.technology,
                    difficulty: session.difficulty,
                    score: session.score,
                    status: "completed",
                    createdAt: session.completedAt,
                  },
                ],
                $position: 0,
                $slice: 20,
              },
              "analytics.interviewScores": {
                $each: [{ score: session.score, at: new Date() }],
                $position: 0,
                $slice: 30,
              },
            },
          }
        );
      }
    } else {
      session.pointsEarned = session.answers.reduce((s, a) => s + (a.points || 0), 0);
      session.correctCount = session.answers.filter((a) => a.isCorrect).length;
      session.percentage = session.maxPoints
        ? Math.round((session.pointsEarned / session.maxPoints) * 100)
        : 0;
      session.score = session.percentage;
    }

    syncAnsweredFlags(session);
    if (typeof session.markModified === "function") {
      session.markModified("questions");
    }
    await persistInterviewSession(session);

    if (req.user) {
      await logActivity(req.user, "interview", `${isCorrect ? "Correct" : "Incorrect"} — ${session.technology}`);
    }

    const clientSession = toClientSession(session);

    sendOk(res, {
      session: clientSession,
      result: buildResultPayload({
        isCorrect,
        aiEvaluation,
        explanation,
        correctAnswer,
        improvementTip,
        qMeta,
        completed,
        session: clientSession,
      }),
    });
  } catch (e) {
    console.error("[interview] submit error", e);
    next(e);
  }
}

export async function getInterviewHistory(req, res) {
  if (!req.user) return sendFail(res, "Sign in to view interview history", 401);

  const items = await InterviewSession.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select(
      "technology difficulty score percentage readiness correctCount totalQuestions status createdAt completedAt aiGenerated questionSource"
    );

  const user = await User.findById(req.user._id).select("analytics.interviewScores");
  const scoreHistory = user?.analytics?.interviewScores || [];

  sendOk(res, {
    history: items.map((i) => toClientSession(i)),
    sessions: items.map((i) => toClientSession(i)),
    scoreHistory,
    geminiEnabled: isGeminiEnabled(),
  });
}

export async function getInterviewById(req, res) {
  const userId = req.user?._id ?? null;
  const doc = await loadInterviewSession(req.params.id, userId);
  if (!doc) return sendFail(res, "Interview session not found", 404);
  const restored = safeRestoreSession(doc);
  sendOk(res, { session: restored.session || toClientSession(doc) });
}

export async function getInterviewSession(req, res) {
  req.params.id = req.params.id || req.params.sessionId;
  return getInterviewById(req, res);
}

export async function getNextQuestion(req, res, next) {
  try {
    const sessionId = req.query.sessionId || req.params.id;
    const userId = req.user?._id ?? null;
    if (!sessionId) return sendFail(res, "sessionId is required", 400);

    const doc = await loadInterviewSession(sessionId, userId);
    if (!doc) return sendFail(res, "Session not found", 404);

    const nextPayload = safeNextQuestion(doc);
    sendOk(res, {
      ...nextPayload,
      question: nextPayload.question
        ? {
            ...nextPayload.question,
            correctAnswer: undefined,
            expectedAnswer: undefined,
          }
        : null,
    });
  } catch (e) {
    next(e);
  }
}

export async function saveInterviewSession(req, res, next) {
  try {
    const sessionId = req.body.sessionId || req.params.id;
    const userId = req.user?._id ?? null;
    if (!sessionId) return sendFail(res, "sessionId is required", 400);

    let session = await loadInterviewSession(sessionId, userId);
    if (!session) return sendFail(res, "Session not found", 404);

    if (req.body.durationSec != null) session.durationSec = Number(req.body.durationSec);
    if (req.body.skippedQuestions) session.skippedQuestions = req.body.skippedQuestions;
    if (typeof req.body.currentQuestionIndex === "number") {
      session.currentQuestionIndex = req.body.currentQuestionIndex;
    }

    syncAnsweredFlags(session);
    await persistInterviewSession(session);

    sendOk(res, {
      session: toClientSession(session),
      saved: true,
    });
  } catch (e) {
    next(e);
  }
}

export async function getInterviewAnalytics(req, res, next) {
  try {
    let sessions = [];
    let scoreHistory = [];

    if (req.user) {
      sessions = await InterviewSession.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      const user = await User.findById(req.user._id).select("analytics.interviewScores");
      scoreHistory = user?.analytics?.interviewScores || [];
    }

    const analytics = buildInterviewAnalytics(
      sessions.map((s) => toClientSession(s)),
      scoreHistory
    );

    sendOk(res, { analytics, geminiEnabled: isGeminiEnabled() });
  } catch (e) {
    next(e);
  }
}

export async function deleteInterview(req, res) {
  if (!req.user) return sendFail(res, "Authentication required", 401);
  if (isGuestSessionId(req.params.id)) {
    return sendFail(res, "Guest sessions cannot be deleted from history", 400);
  }
  const doc = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) return sendFail(res, "Interview session not found", 404);
  await doc.deleteOne();
  sendOk(res, {}, "Interview session deleted");
}

export async function listSessions(req, res) {
  return getInterviewHistory(req, res);
}

export async function createSession(req, res, next) {
  req.body.technology = req.body.technology || req.body.stream;
  req.body.count = req.body.count || 10;
  return generateInterview(req, res, next);
}

export async function bookmarkQuestion(req, res, next) {
  try {
    if (!req.user) return sendFail(res, "Sign in to bookmark questions", 401);
    const { questionId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return sendFail(res, "User not found", 404);
    const oid = questionId;
    if (!user.bookmarkedQuestions.some((x) => String(x) === String(oid))) {
      user.bookmarkedQuestions.push(oid);
      await user.save();
      await logActivity(user, "interview", "Question bookmarked");
    }
    sendOk(res, { bookmarked: user.bookmarkedQuestions.length });
  } catch (e) {
    next(e);
  }
}

export async function getBookmarks(req, res, next) {
  try {
    if (!req.user) return sendFail(res, "Sign in to view bookmarks", 401);
    const user = await User.findById(req.user._id).select("bookmarkedQuestions");
    const questions = await InterviewQuestion.find({ _id: { $in: user?.bookmarkedQuestions || [] } }).limit(100);
    sendOk(res, { questions });
  } catch (e) {
    next(e);
  }
}
