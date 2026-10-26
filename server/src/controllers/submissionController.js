import Review from "../models/Review.js";
import Enquiry from "../models/Enquiry.js";
import Project from "../models/Project.js";
import Category from "../models/Category.js";

export const REVIEW_THANKS =
  "Thank you for sharing your experience. Your review is very much appreciated, it has been received and will appear on the website once the owner has approved it.";
export const ENQUIRY_THANKS =
  "Thank you for your enquiry. It has been received and we will get back to you using your preferred contact method.";

const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_FEATURED = 3;

// GET /api/reviews?page=1&limit=12
// APPROVED reviews only, newest first. toPublic() decides exactly which fields are visible.
export async function listReviews(req, res) {
  const { page = 1, limit = DEFAULT_PAGE_SIZE } = res.locals.query;
  const filter = { status: "approved" };

  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    -Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({
    items: reviews.map((review) => review.toPublic()),
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  });
}

// GET /api/reviews/featured?limit=3
// Approved AND featured reviews only: the ones for the home page.
export async function listFeaturedReviews(req, res) {
  const { limit = DEFAULT_FEATURED } = res.locals.query;

  const reviews = await Review.find({ status: "approved", featured: true })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit);

  res.json({ items: reviews.map((review) => review.toPublic()) });
}

// POST /api/reviews
// The body has already been validated and cleaned. We pass ONLY the visitor's own fields.
// status and featured are never taken from the request, so a new review is always pending.
export async function createReview(req, res) {
  const { name, rating, text, service, projectSlug } = req.body;

  if (
    projectSlug &&
    !(await Project.exists({ slug: projectSlug, status: "published" }))
  ) {
    return res.status(400).json({
      message: "Please check the information you entered.",
      errors: { projectSlug: "Please choose a project from the list." },
    });
  }

  await Review.create({ name, rating, text, service, projectSlug });

  // We only say this AFTER the review has really been saved.
  res.status(201).json({ message: REVIEW_THANKS });
}

// POST /api/enquiries
export async function createEnquiry(req, res) {
  const {
    name,
    phone,
    email,
    contactMethod,
    service,
    category,
    location,
    description,
    consent,
  } = req.body;

  // A chosen category must exist and belong to the chosen service.
  if (category && !(await Category.exists({ slug: category, service }))) {
    return res.status(400).json({
      message: "Please check the information you entered.",
      errors: {
        category:
          "Please choose a category that belongs to the selected service.",
      },
    });
  }

  await Enquiry.create({
    name,
    phone,
    email,
    contactMethod,
    service,
    category: category ?? "",
    location,
    description,
    consent,
  });

  res.status(201).json({ message: ENQUIRY_THANKS });
}
