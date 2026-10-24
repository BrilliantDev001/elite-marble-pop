import Category from "../models/Category.js";
import Project from "../models/Project.js";
import Settings from "../models/Settings.js";
import { SLUG_PATTERN } from "../models/shared.js";
import { httpError } from "../utils/httpError.js";
import {
  toPublicCategory,
  toPublicProjects,
  toPublicSettings,
} from "../utils/publicShapes.js";

const DEFAULT_PAGE_SIZE = 12;

// GET /api/categories?service=marble
// Active categories only, in the order they were created.
export async function listCategories(req, res) {
  const { service } = res.locals.query;

  const filter = { active: true };
  if (service) filter.service = service;

  const categories = await Category.find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  res.json({ items: categories.map(toPublicCategory) });
}

// GET /api/projects?service=&category=&featured=true&page=1&limit=12
// PUBLISHED projects only, newest first.
export async function listProjects(req, res) {
  const {
    service,
    category,
    featured,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
  } = res.locals.query;

  // The filter is built only from checked values, and status is ALWAYS "published".
  const filter = { status: "published" };
  if (service) filter.service = service;
  if (category) filter.category = category;
  if (featured) filter.featured = true;

  const [total, projects] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .sort({ createdAt: -1, _id: -1 }) // the _id tie-break keeps pages stable when dates match
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    items: await toPublicProjects(projects),
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  });
}

// GET /api/projects/:slug
// A draft or archived project gets exactly the same "not found" as a project that does not exist,
// so nobody can discover unpublished work.
export async function getProject(req, res) {
  const { slug } = req.params;
  if (slug.length > 120 || !SLUG_PATTERN.test(slug))
    throw httpError(404, "Project not found.");

  const project = await Project.findOne({ slug, status: "published" }).lean();
  if (!project) throw httpError(404, "Project not found.");

  const [publicProject] = await toPublicProjects([project]);
  res.json({ project: publicProject });
}

// GET /api/settings
// The business contact details, for the footer, contact page and WhatsApp links.
export async function getSettings(req, res) {
  const settings = await Settings.getSite();
  res.json({ settings: toPublicSettings(settings) });
}

// GET /api/projects/options
// A short list of EVERY published project (just slug, title and service), for the project
// drop-down on the review form. The full list is too heavy to send for that.
export async function listProjectOptions(req, res) {
  const projects = await Project.find({ status: "published" })
    .sort({ title: 1 })
    .select("slug title service")
    .limit(500)
    .lean();

  res.json({
    items: projects.map((project) => ({ slug: project.slug, title: project.title, service: project.service })),
  });
}