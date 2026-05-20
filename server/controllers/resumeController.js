import fs from "fs/promises";
import path from "path";
import { User } from "../models/User.js";
import { ResumeAnalysis } from "../models/ResumeAnalysis.js";
import { logActivity } from "../services/activity.js";
import { analyzeResumeText, extractTextFromFile, getTargetRoles } from "../services/resumeAnalyzer.js";
import { analyzeResumeWithAI, mergeResumeWithAi } from "../services/aiService.js";
import { isGeminiEnhanceEnabled } from "../config/aiMode.js";
import { RESUME_UPLOAD_DIR } from "../middleware/uploadMiddleware.js";

function toResponse(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  o.id = String(o._id || o.id);
  if (!o.resumeName && o.fileName) o.resumeName = o.fileName;
  return o;
}

function buildRecord(userId, file, targetRole, analysis) {
  return {
    userId,
    fileName: file.originalname,
    resumeName: file.originalname,
    filePath: `/uploads/resumes/${file.filename}`,
    mimeType: file.mimetype,
    targetRole: analysis.targetRole || targetRole,
    extracted: analysis.extracted,
    overallScore: analysis.overallScore,
    atsScore: analysis.atsScore,
    skillScore: analysis.skillScore,
    projectScore: analysis.projectScore,
    experienceScore: analysis.experienceScore,
    sectionScores: analysis.sectionScores,
    improvementAreas: analysis.improvementAreas,
    extractedSkills: analysis.extractedSkills,
    detectedSkills: analysis.detectedSkills || analysis.extractedSkills,
    matchedKeywords: analysis.matchedKeywords,
    missingSkills: analysis.missingSkills,
    recommendedSkills: analysis.recommendedSkills,
    prioritySkills: analysis.prioritySkills,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    suggestions: analysis.suggestions,
    recommendations: analysis.recommendations,
    recommendedProjects: analysis.recommendedProjects,
    aiSuggestions: analysis.aiSuggestions,
    industryMatch: analysis.industryMatch,
    roleFit: analysis.roleFit,
    trendScore: analysis.trendScore,
    demandPercentage: analysis.demandPercentage,
    resumeLevel: analysis.resumeLevel,
    keywordScore: analysis.keywordScore,
    keywordDensity: analysis.keywordDensity,
    formattingScore: analysis.formattingScore,
    heuristicScore: analysis.heuristicScore,
    grammarScore: analysis.grammarScore,
    grammarIssues: analysis.grammarIssues,
    skillRadar: analysis.skillRadar,
    technologyRadar: analysis.technologyRadar,
    marketDemand: analysis.marketDemand,
    chartsData: analysis.chartsData,
    careerSuggestions: analysis.careerSuggestions,
    suitableRoles: analysis.suitableRoles,
    roadmapSuggestions: analysis.roadmapSuggestions,
    wordCount: analysis.wordCount,
    aiPowered: Boolean(analysis.aiPowered),
    geminiGenerated: Boolean(analysis.geminiGenerated),
    keywordOptimization: analysis.keywordOptimization,
    projectSuggestions: analysis.projectSuggestions,
    careerSuggestions: analysis.careerSuggestions,
    interviewReadiness: analysis.interviewReadiness,
    status: "analyzed",
  };
}

export async function listTargetRoles(_req, res) {
  const roles = await getTargetRoles();
  res.json({ targetRoles: roles });
}

export async function analyzeResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Resume file required (PDF or DOCX, max 5MB)" });
    }

    const targetRole = String(
      req.body.targetRole || req.user.targetRole || "software engineer"
    ).trim();

    console.log("[resume] analyze:", req.file.originalname, "role:", targetRole);

    const text = await extractTextFromFile(req.file.path, req.file.mimetype);
    const profileContext = {
      fullName: req.user.fullName,
      email: req.user.email,
      github: req.user.github,
      linkedin: req.user.linkedin,
      skills: req.user.skills || [],
    };

    let analysis = await analyzeResumeText(text, targetRole, profileContext);
    if (isGeminiEnhanceEnabled()) {
      try {
        const ai = await analyzeResumeWithAI(text, targetRole, profileContext, req.user._id);
        if (ai.ok && ai.data) {
          analysis = mergeResumeWithAi(analysis, ai.data);
        }
      } catch (e) {
        console.warn("[resume] Gemini enhance skipped:", e.message);
      }
    }
    const record = await ResumeAnalysis.create(buildRecord(req.user._id, req.file, targetRole, analysis));

    await User.updateOne(
      { _id: req.user._id },
      {
        $push: {
          resumes: {
            $each: [
              {
                fileName: record.fileName,
                filePath: record.filePath,
                targetRole: record.targetRole,
                overallScore: record.overallScore,
                atsScore: record.atsScore,
                status: "analyzed",
                createdAt: record.createdAt,
              },
            ],
            $position: 0,
            $slice: 20,
          },
          "analytics.resumeScores": {
            $each: [{ score: record.overallScore, at: new Date() }],
            $position: 0,
            $slice: 30,
          },
        },
      }
    );

    await logActivity(req.user, "resume", `Resume analyzed — ${record.overallScore}% (${record.resumeLevel})`);

    console.log("[resume] saved to MongoDB resumeanalyses:", record._id.toString());

    const payload = toResponse(record);
    res.status(201).json({
      success: true,
      analysis: payload,
      ...analysis,
      id: payload.id,
    });
  } catch (e) {
    console.error("[resume] analyze error:", e.message);
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(e);
  }
}

export async function getResumeHistory(req, res) {
  const items = await ResumeAnalysis.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select(
      "fileName resumeName targetRole overallScore atsScore skillScore resumeLevel createdAt extractedSkills missingSkills industryMatch roleFit"
    );

  const user = await User.findById(req.user._id).select("analytics.resumeScores");
  const scoreHistory = user?.analytics?.resumeScores || [];

  let improvement = 0;
  if (scoreHistory.length >= 2) {
    improvement = scoreHistory[0].score - scoreHistory[scoreHistory.length - 1].score;
  }

  res.json({
    success: true,
    history: items.map((i) => toResponse(i)),
    scoreHistory,
    improvementPercent: improvement,
  });
}

export async function getResumeById(req, res) {
  const doc = await ResumeAnalysis.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!doc) {
    return res.status(404).json({ success: false, message: "Resume analysis not found" });
  }

  res.json({ success: true, analysis: toResponse(doc) });
}

export async function deleteResume(req, res) {
  const doc = await ResumeAnalysis.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!doc) {
    return res.status(404).json({ success: false, message: "Resume analysis not found" });
  }

  if (doc.filePath) {
    const filename = path.basename(doc.filePath);
    await fs.unlink(path.join(RESUME_UPLOAD_DIR, filename)).catch(() => {});
  }

  await doc.deleteOne();
  console.log("[resume] deleted:", doc._id.toString());

  res.json({ success: true, message: "Resume analysis deleted" });
}

export async function listResumes(req, res) {
  const items = await ResumeAnalysis.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);
  const roles = await getTargetRoles();
  res.json({
    resumes: items.map((i) => toResponse(i)),
    targetRoles: roles,
  });
}
