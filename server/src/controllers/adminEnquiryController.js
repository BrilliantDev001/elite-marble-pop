import Enquiry from "../models/Enquiry.js";
import Category from "../models/Category.js";
import { ENQUIRY_STATUSES } from "../models/shared.js";
import { countBy } from "../utils/counts.js";
import { httpError } from "../utils/httpError.js";

// Adds the readable name of each enquiry's category, in ONE query for the whole list.
async function withCategoryNames(enquiries) {
  const slugs = [
    ...new Set(enquiries.map((enquiry) => enquiry.category).filter(Boolean)),
  ];
  const categories = slugs.length
    ? await Category.find({ slug: { $in: slugs } })
        .select("slug name")
        .lean()
    : [];
  const names = new Map(
    categories.map((category) => [category.slug, category.name]),
  );

  return enquiries.map((enquiry) => ({
    ...enquiry.toJSON(),
    categoryName: enquiry.category
      ? (names.get(enquiry.category) ?? enquiry.category)
      : null,
  }));
}

// GET /api/admin/enquiries?status=New&service=marble&page=1&limit=50
// Private customer details. Newest first.
export async function listEnquiries(req, res) {
  const { status, service, page = 1, limit = 50 } = res.locals.query;

  const filter = {};
  if (status) filter.status = status;
  if (service) filter.service = service;

  const [total, enquiries, counts] = await Promise.all([
    Enquiry.countDocuments(filter),
    Enquiry.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    countBy(Enquiry, "status", ENQUIRY_STATUSES),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({
    items: await withCategoryNames(enquiries),
    counts,
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  });
}

// GET /api/admin/enquiries/:id
export async function getEnquiry(req, res) {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw httpError(404, "Enquiry not found.");

  const [item] = await withCategoryNames([enquiry]);
  res.json({ enquiry: item });
}

// PATCH /api/admin/enquiries/:id   body: { "status": "Contacted" }
// The status is for the owner's own tracking. It is the ONLY thing that can change.
export async function updateEnquiry(req, res) {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw httpError(404, "Enquiry not found.");

  enquiry.status = req.body.status;
  await enquiry.save();

  const [item] = await withCategoryNames([enquiry]);
  res.json({ enquiry: item });
}
