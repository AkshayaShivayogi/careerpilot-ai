import { InterviewQuestion } from "../models/InterviewQuestion.js";

export async function getSaved(req, res, next) {
  try {
    const user = req.user;
    const bookmarked = await InterviewQuestion.find({ _id: { $in: user.bookmarkedQuestions } }).limit(50);
    const savedRoadmaps = (user.roadmaps || []).filter((r) =>
      user.savedRoadmapIds?.some((id) => id.equals(r._id))
    );

    res.json({
      roadmaps: savedRoadmaps,
      interviewSessions: user.interviewSessions?.filter((s) => s.status === "completed").slice(0, 20) || [],
      resumes: user.resumes || [],
      bookmarkedQuestions: bookmarked,
      planners: user.planners || [],
    });
  } catch (e) {
    next(e);
  }
}
