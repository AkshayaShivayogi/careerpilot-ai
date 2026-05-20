import { RoadmapReview } from "../models/RoadmapReview.js";

export async function listReviews(req, res) {
  const technology = req.query.technology ? String(req.query.technology).trim() : null;
  const filter = technology ? { technology } : {};
  const reviews = await RoadmapReview.find(filter).sort({ helpfulCount: -1, createdAt: -1 }).limit(50).lean();
  res.json({ reviews });
}

export async function createReview(req, res, next) {
  try {
    const technology = String(req.body.technology || "").trim();
    const rating = Number(req.body.rating);
    if (!technology) return res.status(400).json({ message: "Technology required" });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating 1-5 required" });

    const review = await RoadmapReview.create({
      userId: req.user._id,
      authorName: req.user.fullName || "Learner",
      technology,
      rating,
      comment: String(req.body.comment || "").trim(),
      difficulty: req.body.difficulty || "medium",
      improvement: String(req.body.improvement || "").trim(),
      experience: String(req.body.experience || "").trim(),
      reportOutdated: Boolean(req.body.reportOutdated),
    });

    res.status(201).json({ review });
  } catch (e) {
    next(e);
  }
}

export async function markHelpful(req, res, next) {
  try {
    const review = await RoadmapReview.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    const uid = req.user._id;
    if (!review.helpfulBy.some((x) => x.equals(uid))) {
      review.helpfulBy.push(uid);
      review.helpfulCount += 1;
      await review.save();
    }
    res.json({ review });
  } catch (e) {
    next(e);
  }
}

export async function reviewAnalytics(req, res) {
  const stats = await RoadmapReview.aggregate([
    {
      $group: {
        _id: "$technology",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
        hardCount: { $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const overall = await RoadmapReview.aggregate([
    { $group: { _id: null, avgRating: { $avg: "$rating" }, total: { $sum: 1 } } },
  ]);

  res.json({
    byTechnology: stats,
    averageRating: overall[0]?.avgRating ? Number(overall[0].avgRating.toFixed(1)) : 0,
    totalReviews: overall[0]?.total || 0,
    mostDifficult: stats.sort((a, b) => b.hardCount - a.hardCount)[0]?._id || null,
  });
}
