import Project from "../models/Project.js";
import Category from "../models/Category.js";
import { httpError, fieldError } from "../utils/httpError.js";
import { slugify } from "../utils/text.js";
import { filesOf, prepareProjectPhotos, deleteRemovedFiles } from "../utils/photos.js";

// The web address must not be used by another project.
async function assertSlugFree(slug, ignoreId) {
  // "options" is used by the public API (/api/projects/options), so no project may take it.
  if (slug === "options") {
    throw fieldError(409, "slug", "This web address is reserved. Please choose a different one.");
  }
  const filter = ignoreId ? { slug, _id: { $ne: ignoreId } } : { slug };
  if (await Project.exists(filter)) {
    throw fieldError(
      409,
      "slug",
      "Another project already uses this web address. Please change it.",
    );
  }
}

// The category must exist, belong to the chosen service and (when newly chosen) be active.
async function assertCategory(service, categorySlug) {
  const category = await Category.findOne({ slug: categorySlug })
    .select("service active")
    .lean();
  if (!category)
    throw fieldError(
      400,
      "category",
      "Please choose a category from the list.",
    );
  if (category.service !== service) {
    throw fieldError(
      400,
      "category",
      "This category does not belong to the chosen service. Please choose again.",
    );
  }
  if (!category.active) {
    throw fieldError(
      400,
      "category",
      "This category is archived. Please choose an active category.",
    );
  }
}

// GET /api/admin/projects?status=&service=&category=&page=1&limit=50
// ALL projects, whatever their status, most recently changed first.
// "counts" always covers every project (for the status tabs), whatever the filters.
export async function listProjects(req, res) {
  const { status, service, category, page = 1, limit = 50 } = res.locals.query;

  const filter = {};
  if (status) filter.status = status;
  if (service) filter.service = service;
  if (category) filter.category = category;

  const [total, projects, grouped] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const counts = { all: 0, draft: 0, published: 0, archived: 0 };
  for (const group of grouped) {
    counts[group._id] = group.count;
    counts.all += group.count;
  }

  const totalPages = Math.ceil(total / limit);
  res.json({
    items: projects.map((project) => project.toJSON()),
    counts,
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  });
}

// GET /api/admin/projects/:id
export async function getProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) throw httpError(404, "Project not found.");
  res.json({ project: project.toJSON() });
}

// POST /api/admin/projects
export async function createProject(req, res) {
  const data = req.body; // already validated, cleaned and limited to the allowed fields

  const slug = data.slug ?? slugify(data.title);
  if (!slug) throw fieldError(400, "slug", "Please enter a web address.");

  await assertSlugFree(slug);
  await assertCategory(data.service, data.category);

  // Every photo is checked (new ImageKit uploads are verified with ImageKit) before anything is saved.
  const photos = await prepareProjectPhotos({ coverImage: data.coverImage, images: data.images });

  const project = await Project.create({ ...data, ...photos, slug });
  res.status(201).json({ project: project.toJSON() });
}

// PATCH /api/admin/projects/:id
// Send only what changed. This one route also covers publish, unpublish, archive, restore,
// feature and unfeature (they are just changes to "status" and "featured").
export async function updateProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) throw httpError(404, "Project not found.");

  // Leave out anything that is not really there, so a missing value can never wipe a field.
  const changes = Object.fromEntries(
    Object.entries(req.body).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(changes).length === 0)
    throw httpError(400, "There is nothing to change.");

  const service = changes.service ?? project.service;
  const category = changes.category ?? project.category;

  // Only check the category when the project is being MOVED. A project that keeps its
  // (possibly now-archived) category can still be edited.
  if (service !== project.service || category !== project.category) {
    await assertCategory(service, category);
  }

  if (changes.slug && changes.slug !== project.slug) {
    await assertSlugFree(changes.slug, project._id);
  }

  // Photos: any NEW photo is verified with ImageKit before anything is saved.
  const photosBefore = filesOf(project.coverImage, ...project.images);
  if (changes.coverImage || changes.images) {
    const photos = await prepareProjectPhotos(
      { coverImage: changes.coverImage, images: changes.images },
      { knownFiles: photosBefore, exceptProjectId: project._id }
    );
    Object.assign(changes, photos);
  }

  project.set(changes);
  await project.save(); // runs the model's rules as well

  // Photos that were taken off this project are deleted from ImageKit.
  await deleteRemovedFiles(photosBefore, filesOf(project.coverImage, ...project.images));

  res.json({ project: project.toJSON() });
}
