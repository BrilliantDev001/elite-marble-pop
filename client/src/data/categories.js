import { makeImage } from "./images";

// Reusable categories. Projects will reference a category by its slug,
// so there is no free-text typing and no accidental duplicates.
//
// NOTE: these are PROPOSED categories from the project brief. They are not
// confirmed services yet. The owner will confirm or change them later.
// To add one, copy a block, give it a unique slug, and set the right "service".

export const categories = [
  // ---------- MARBLE ----------
  {
    slug: "kitchen-countertops",
    service: "marble",
    name: "Kitchen Countertops",
    description: "Marble worktops and islands cut to fit your kitchen.",
    image: makeImage(
      "marble-kitchen.jpg",
      "Kitchen island with a polished marble countertop and waterfall edge",
    ),
    active: true,
  },
  {
    slug: "tombs-and-burial-grounds",
    service: "marble",
    name: "Tombs & Burial Grounds",
    description:
      "Dignified marble tombs and memorial construction, built with care.",
    image: makeImage(
      "marble-tomb.jpg",
      "Clean white marble tomb with simple engraved headstone",
    ),
    active: true,
  },
  {
    slug: "pulpits",
    name: "Pulpits",
    service: "marble",
    description: "Marble pulpits and altar work for places of worship.",
    image: makeImage(
      "marble-pulpit.jpg",
      "Marble pulpit with a smooth finish inside a place of worship",
    ),
    active: true,
  },
  {
    slug: "staircases-and-flooring",
    service: "marble",
    name: "Staircases & Flooring",
    description:
      "Marble stairs and floors that carry a space from entrance to room.",
    image: makeImage(
      "marble-stairs.jpg",
      "Curved staircase with polished marble steps and a matching marble floor",
    ),
    active: true,
  },
  {
    slug: "marble-furniture",
    service: "marble",
    name: "Marble Furniture",
    description: "Tables, desks, chairs and other pieces made from marble.",
    image: makeImage(
      "marble-furniture.jpg",
      "Round marble dining table with a polished top",
    ),
    active: true,
  },

  // ---------- POP ----------
  {
    slug: "pop-ceilings",
    service: "pop",
    name: "POP Ceilings",
    description: "Smooth, well-finished plaster ceilings for any room.",
    image: makeImage(
      "pop-ceiling.jpg",
      "Smooth white POP ceiling with recessed lighting in a living room",
    ),
    active: true,
  },
  {
    slug: "decorative-ceilings",
    service: "pop",
    name: "Decorative Ceiling Designs",
    description: "Layered, patterned and sculpted ceiling designs.",
    image: makeImage(
      "pop-decorative-ceiling.jpg",
      "Decorative layered POP ceiling design with a central medallion",
    ),
    active: true,
  },
  {
    slug: "ceiling-mouldings-cornices",
    service: "pop",
    name: "Ceiling Mouldings & Cornices",
    description: "Cornices and mouldings that frame the edges of a ceiling.",
    image: makeImage(
      "pop-cornice.jpg",
      "Detailed plaster cornice where a white wall meets the ceiling",
    ),
    active: true,
  },
  {
    slug: "decorative-wall-mouldings",
    service: "pop",
    name: "Decorative Wall Mouldings",
    description: "Panelled and moulded wall details in plaster.",
    image: makeImage(
      "pop-wall-moulding.jpg",
      "White plaster wall with decorative panel mouldings",
    ),
    active: true,
  },
];

// Helpers used by pages and filters later.
export function getCategoriesByService(service) {
  return categories.filter((c) => c.service === service && c.active);
}

export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug);
}

// Builds a shareable gallery link.
// Usage: getGalleryLink({ service: "marble", category: "kitchen-countertops" })
//   -> "/gallery?service=marble&category=kitchen-countertops"
// Leave a value out to skip it. With no values it returns "/gallery".
export function getGalleryLink({ service = "", category = "" } = {}) {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/gallery?${query}` : "/gallery";
}