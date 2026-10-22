import Category from "../models/Category.js";

// These functions decide EXACTLY which fields the public website can see.
// Anything not listed here is never sent. The code expects "lean" database results (plain objects).

export function toPublicImage(image) {
  // The ImageKit file ID is internal and is not included.
  return { url: image.url, alt: image.alt, caption: image.caption ?? "" };
}

// Turns a list of projects into their public form. It also looks up each category's display name
// in ONE query (including archived categories, so an archived category never breaks a project).
export async function toPublicProjects(projects) {
  const slugs = [...new Set(projects.map((project) => project.category))];
  const categories = await Category.find({ slug: { $in: slugs } })
    .select("slug name")
    .lean();
  const names = new Map(
    categories.map((category) => [category.slug, category.name]),
  );

  return projects.map((project) => ({
    id: String(project._id),
    title: project.title,
    slug: project.slug,
    service: project.service,
    category: project.category,
    categoryName: names.get(project.category) ?? project.category,
    description: project.description ?? "",
    details: project.details ?? "",
    location: project.location ?? null,
    coverImage: toPublicImage(project.coverImage),
    images: (project.images ?? []).map(toPublicImage),
    featured: Boolean(project.featured),
    isSample: Boolean(project.isSample),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }));
}

export function toPublicCategory(category) {
  return {
    slug: category.slug,
    service: category.service,
    name: category.name,
    description: category.description,
    image: category.image ? toPublicImage(category.image) : null,
  };
}

export function toPublicSettings(settings) {
  return {
    phoneDisplay: settings.phoneDisplay,
    whatsappNumber: settings.whatsappNumber,
    email: settings.email,
    address: settings.address,
  };
}
