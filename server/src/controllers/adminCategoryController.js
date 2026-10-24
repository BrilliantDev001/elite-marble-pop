import Category from "../models/Category.js";
import Project from "../models/Project.js";
import { httpError, fieldError } from "../utils/httpError.js";
import { slugify, normalizeName } from "../utils/text.js";

const SERVICE_LABELS = { marble: "Marble", pop: "POP" };

// A category name must not match another category, even with different capitals, plurals or
// punctuation. The database enforces this too, but this gives a friendlier message.
async function assertNameFree(name, ignoreSlug) {
  const filter = { nameKey: normalizeName(name) };
  if (ignoreSlug) filter.slug = { $ne: ignoreSlug };

  const duplicate = await Category.findOne(filter)
    .select("name service active")
    .lean();
  if (duplicate) {
    const where = SERVICE_LABELS[duplicate.service];
    throw fieldError(
      409,
      "name",
      duplicate.active
        ? `A category called "${duplicate.name}" already exists under ${where}.`
        : `A category called "${duplicate.name}" already exists under ${where} (archived). Restore it from the list instead.`,
    );
  }
}

// The admin version of a category: everything, plus how many projects use it (any status).
async function withProjectCount(category) {
  const projectCount = await Project.countDocuments({
    category: category.slug,
  });
  return { ...category.toJSON(), projectCount };
}

// GET /api/admin/categories?service=marble&active=false
// ALL categories (active and archived), oldest first. Categories are few, so there is no paging.
export async function listCategories(req, res) {
  const { service, active } = res.locals.query;

  const filter = {};
  if (service) filter.service = service;
  if (active) filter.active = active === "true";

  const [categories, grouped] = await Promise.all([
    Category.find(filter).sort({ createdAt: 1, _id: 1 }),
    Project.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
  ]);

  const counts = new Map(grouped.map((group) => [group._id, group.count]));

  res.json({
    items: categories.map((category) => ({
      ...category.toJSON(),
      projectCount: counts.get(category.slug) ?? 0,
    })),
    total: categories.length,
  });
}

// POST /api/admin/categories
export async function createCategory(req, res) {
  const { name, service, description, image } = req.body;

  const slug = slugify(name);
  if (!slug)
    throw fieldError(
      400,
      "name",
      "Please use at least one letter or number in the name.",
    );

  await assertNameFree(name);
  if (await Category.exists({ slug })) {
    throw fieldError(
      409,
      "name",
      "This name is too similar to an existing category. Please choose a different one.",
    );
  }

  const category = await Category.create({
    slug,
    name,
    service,
    description,
    image,
    active: true,
  });
  res.status(201).json({ category: await withProjectCount(category) });
}

// PATCH /api/admin/categories/:slug
// Rename, change the description or photo, or archive and restore ("active").
// The web address and service cannot change.
export async function updateCategory(req, res) {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) throw httpError(404, "Category not found.");

  // Leave out anything that is not really there, so a missing value can never wipe a field.
  const changes = Object.fromEntries(
    Object.entries(req.body).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(changes).length === 0)
    throw httpError(400, "There is nothing to change.");

  if (changes.name && changes.name !== category.name) {
    await assertNameFree(changes.name, category.slug);
  }

  category.set(changes);
  await category.save();
  res.json({ category: await withProjectCount(category) });
}
