import { makeImage } from "./images";

// SAMPLE PROJECTS ONLY.
// These are demo projects built from placeholder stock photos so we can test
// the gallery, filters, lightbox and "Load More". They are NOT real ELITE work.
// Every project has isSample: true so the interface can label it as a sample.
//
// A project = one completed job. It has ONE cover image plus optional extra
// photos in the "images" array (can be empty).
//
// "category" must match a slug in categories.js.
// "service" is "marble" or "pop".
// "status" is "published", "draft" or "archived". Only "published" shows publicly.
// "location" is optional and left null: only add it when the owner approves it.

// One shared list of photos, so each photo's alt text is written once.
// If you change a photo in public/placeholders/, update its alt text here too
// (and in categories.js / services.js if it is used there).
const photos = {
  heroMarble: makeImage(
    "hero-marble.jpg",
    "Polished marble surface with soft grey veining in a bright interior",
  ),
  heroPop: makeImage(
    "hero-pop.jpg",
    "Elegant white plaster ceiling with layered recessed design and soft lighting",
  ),
  heroInterior: makeImage(
    "hero-interior.jpg",
    "Finished interior with a marble floor and a plaster ceiling",
  ),
  marbleKitchen: makeImage(
    "marble-kitchen.jpg",
    "Kitchen island with a polished marble countertop and waterfall edge",
  ),
  marbleTomb: makeImage(
    "marble-tomb.jpg",
    "Clean white marble tomb with simple engraved headstone",
  ),
  marblePulpit: makeImage(
    "marble-pulpit.jpg",
    "Marble pulpit with a smooth finish inside a place of worship",
  ),
  marbleStairs: makeImage(
    "marble-stairs.jpg",
    "Curved staircase with polished marble steps and a matching marble floor",
  ),
  marbleFurniture: makeImage(
    "marble-furniture.jpg",
    "Round marble dining table with a polished top",
  ),
  popCeiling: makeImage(
    "pop-ceiling.jpg",
    "Smooth white POP ceiling with recessed lighting in a living room",
  ),
  popDecorativeCeiling: makeImage(
    "pop-decorative-ceiling.jpg",
    "Decorative layered POP ceiling design with a central medallion",
  ),
  popCornice: makeImage(
    "pop-cornice.jpg",
    "Detailed plaster cornice where a white wall meets the ceiling",
  ),
  popWallMoulding: makeImage(
    "pop-wall-moulding.jpg",
    "White plaster wall with decorative panel mouldings",
  ),
};

export const projects = [
  {
    id: "p1",
    title: "Marble Kitchen Island",
    slug: "marble-kitchen-island",
    service: "marble",
    category: "kitchen-countertops",
    description: "A kitchen island with a polished marble top.",
    details: "Sample project used to test the project page layout.",
    coverImage: photos.marbleKitchen,
    images: [
      { ...photos.heroMarble, caption: "Close view of the surface finish" },
    ],
    location: null,
    featured: true,
    status: "published",
    isSample: true,
    createdAt: "2026-03-12",
    updatedAt: "2026-03-12",
  },
  {
    id: "p2",
    title: "Marble Kitchen Worktop",
    slug: "marble-kitchen-worktop",
    service: "marble",
    category: "kitchen-countertops",
    description: "",
    details: "",
    coverImage: photos.heroMarble,
    images: [],
    location: null,
    featured: false,
    status: "published",
    isSample: true,
    createdAt: "2026-02-20",
    updatedAt: "2026-02-20",
  },
  {
    id: "p3",
    title: "Marble Memorial Tomb",
    slug: "marble-memorial-tomb",
    service: "marble",
    category: "tombs-and-burial-grounds",
    description: "A simple, dignified marble tomb.",
    details: "",
    coverImage: photos.marbleTomb,
    images: [],
    location: null,
    featured: false,
    status: "published",
    isSample: true,
    createdAt: "2026-02-05",
    updatedAt: "2026-02-05",
  },
  {
    id: "p4",
    title: "Marble Pulpit",
    slug: "marble-pulpit",
    service: "marble",
    category: "pulpits",
    description: "A marble pulpit with a smooth, even finish.",
    details: "",
    coverImage: photos.marblePulpit,
    images: [photos.heroMarble],
    location: null,
    featured: false,
    status: "published",
    isSample: true,
    createdAt: "2026-01-28",
    updatedAt: "2026-01-28",
  },
  {
    id: "p5",
    title: "Curved Marble Staircase",
    slug: "curved-marble-staircase",
    service: "marble",
    category: "staircases-and-flooring",
    description: "A curved staircase with matching marble flooring.",
    details: "Sample project with several photos, used to test the lightbox.",
    coverImage: photos.marbleStairs,
    images: [
      {
        ...photos.heroInterior,
        caption: "The staircase within the finished interior",
      },
      photos.heroMarble,
    ],
    location: null,
    featured: true,
    status: "published",
    isSample: true,
    createdAt: "2026-01-15",
    updatedAt: "2026-01-15",
  },
  {
    id: "p6",
    title: "Marble Dining Table",
    slug: "marble-dining-table",
    service: "marble",
    category: "marble-furniture",
    description: "A round dining table with a polished marble top.",
    details: "",
    coverImage: photos.marbleFurniture,
    images: [],
    location: null,
    featured: false,
    status: "published",
    isSample: true,
    createdAt: "2026-01-05",
    updatedAt: "2026-01-05",
  },
  {
    id: "p7",
    title: "Living Room POP Ceiling",
    slug: "living-room-pop-ceiling",
    service: "pop",
    category: "pop-ceilings",
    description: "A smooth ceiling with recessed lighting.",
    details: "",
    coverImage: photos.popCeiling,
    images: [photos.heroInterior],
    location: null,
    featured: true,
    status: "published",
    isSample: true,
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  },
  {
    id: "p8",
    title: "Layered Decorative Ceiling",
    slug: "layered-decorative-ceiling",
    service: "pop",
    category: "decorative-ceilings",
    description: "A layered ceiling design with a central feature.",
    details: "",
    coverImage: photos.popDecorativeCeiling,
    images: [photos.heroPop],
    location: null,
    featured: true,
    status: "published",
    isSample: true,
    createdAt: "2026-02-14",
    updatedAt: "2026-02-14",
  },
  {
    id: "p9",
    title: "Detailed Cornice Work",
    slug: "detailed-cornice-work",
    service: "pop",
    category: "ceiling-mouldings-cornices",
    description: "",
    details: "",
    coverImage: photos.popCornice,
    images: [],
    location: null,
    featured: false,
    status: "published",
    isSample: true,
    createdAt: "2026-01-22",
    updatedAt: "2026-01-22",
  },
  {
    id: "p10",
    title: "Panel Moulded Wall",
    slug: "panel-moulded-wall",
    service: "pop",
    category: "decorative-wall-mouldings",
    description: "Decorative panel mouldings on a feature wall.",
    details: "",
    coverImage: photos.popWallMoulding,
    images: [],
    location: null,
    featured: false,
    status: "published",
    isSample: true,
    createdAt: "2026-01-10",
    updatedAt: "2026-01-10",
  },
  {
    id: "p11",
    title: "Guest Room POP Ceiling",
    slug: "guest-room-pop-ceiling",
    service: "pop",
    category: "pop-ceilings",
    description: "",
    details: "",
    coverImage: photos.heroPop,
    images: [],
    location: null,
    featured: false,
    status: "published",
    isSample: true,
    createdAt: "2025-12-18",
    updatedAt: "2025-12-18",
  },
  {
    id: "p12",
    title: "Marble Entrance Floor",
    slug: "marble-entrance-floor",
    service: "marble",
    category: "staircases-and-flooring",
    description: "A marble floor for an entrance hall.",
    details: "",
    coverImage: photos.heroInterior,
    images: [],
    location: null,
    featured: false,
    status: "published",
    isSample: true,
    createdAt: "2025-12-05",
    updatedAt: "2025-12-05",
  },
  {
    // A DRAFT, so we can confirm unpublished projects never appear publicly.
    id: "p13",
    title: "Draft Project (Should Not Appear)",
    slug: "draft-project",
    service: "marble",
    category: "kitchen-countertops",
    description: "If you can see this on the public site, something is wrong.",
    details: "",
    coverImage: photos.heroMarble,
    images: [],
    location: null,
    featured: true,
    status: "draft",
    isSample: true,
    createdAt: "2026-03-20",
    updatedAt: "2026-03-20",
  },
];

// ---------- Helpers used by pages ----------

// Only published projects, newest first. Public pages must always use this.
export function getPublishedProjects() {
  return projects
    .filter((project) => project.status === "published")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getProjectBySlug(slug) {
  return getPublishedProjects().find((project) => project.slug === slug);
}

export function getFeaturedProjects(limit = 4) {
  return getPublishedProjects()
    .filter((project) => project.featured)
    .slice(0, limit);
}

// Filters by service and/or category. Leave a value empty to skip that filter.
// Usage: filterProjects({ service: "marble", category: "kitchen-countertops" })
export function filterProjects({ service = "", category = "" } = {}) {
  return getPublishedProjects().filter((project) => {
    const matchesService = !service || project.service === service;
    const matchesCategory = !category || project.category === category;
    return matchesService && matchesCategory;
  });
}

// All photos of a project in one list, cover first. Used by the lightbox.
export function getProjectImages(project) {
  return [project.coverImage, ...project.images];
}
