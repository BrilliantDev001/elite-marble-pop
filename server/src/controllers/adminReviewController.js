import Review from "../models/Review.js";
import Project from "../models/Project.js";
import { REVIEW_STATUSES } from "../models/shared.js";
import { countBy } from "../utils/counts.js";
import { httpError } from "../utils/httpError.js";

// Adds the title of the project each review is about, in ONE query for the whole list.
async function withProjectTitles(reviews) {
  const slugs = [
    ...new Set(reviews.map((review) => review.projectSlug).filter(Boolean)),
  ];
  const projects = slugs.length
    ? await Project.find({ slug: { $in: slugs } })
        .select("slug title")
        .lean()
    : [];
  const titles = new Map(
    projects.map((project) => [project.slug, project.title]),
  );

  return reviews.map((review) => ({
    ...review.toJSON(),
    projectTitle: review.projectSlug
      ? (titles.get(review.projectSlug) ?? null)
      : null,
  }));
}

// GET /api/admin/reviews?status=pending&page=1&limit=50
// ALL reviews (pending, approved and rejected), newest first.
// "counts" always covers every review, whatever the filter (for the status tabs).
export async function listReviews(req, res) {
  const { status, page = 1, limit = 50 } = res.locals.query;
  const filter = status ? { status } : {};

  const [total, reviews, counts] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    countBy(Review, "status", REVIEW_STATUSES),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({
    items: await withProjectTitles(reviews),
    counts,
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  });
}

// GET /api/admin/reviews/:id
export async function getReview(req, res) {
  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, "Review not found.");

  const [item] = await withProjectTitles([review]);
  res.json({ review: item });
}

// PATCH /api/admin/reviews/:id   body: { "action": "approve" | "reject" | "feature" | "unfeature" }
// Each action uses the model's own methods, so the rules cannot be skipped:
//   approve   -> approved (NOT featured)
//   reject    -> rejected, and removed from the home page
//   feature   -> only allowed for approved reviews (otherwise 409)
//   unfeature -> removed from the home page; stays approved
export async function updateReview(req, res) {
  const review = await Review.findById(req.params.id);
  if (!review) throw httpError(404, "Review not found.");

  switch (req.body.action) {
    case "approve":
      await review.approve();
      break;
    case "reject":
      await review.reject();
      break;
    case "feature":
      await review.setFeatured(true);
      break;
    case "unfeature":
      await review.setFeatured(false);
      break;
  }

  const [item] = await withProjectTitles([review]);
  res.json({ review: item });
}
