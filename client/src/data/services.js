import { makeImage } from "./images";

// The two specialties. Pricing text explains what affects cost in plain
// language. NO prices or price ranges are shown, by design.

export const services = [
  {
    id: "marble",
    slug: "marble",
    name: "Marble Works",
    shortName: "Marble",
    tagline: "Natural stone, precisely cut and finished.",
    intro:
      "From kitchen countertops to staircases and memorial work, we shape and install marble with careful attention to finish and fit.",
    heroImage: makeImage(
      "hero-marble.jpg",
      "Polished marble surface with soft grey veining in a bright interior",
    ),
    pricingIntro:
      "Every marble project is different, so we prepare a personalised quote after understanding what you need. These are the main factors that affect the cost:",
    pricingFactors: [
      "Material type and grade",
      "Colour, pattern, texture and availability",
      "Dimensions and amount of material needed",
      "Edge profiles and surface finishing",
      "Design complexity",
      "Transport and installation location",
      "Site conditions and installation requirements",
    ],
  },
  {
    id: "pop",
    slug: "pop",
    name: "POP Works",
    shortName: "POP",
    tagline: "Plaster designs that shape the room above and around you.",
    intro:
      "From clean, modern ceilings to detailed mouldings and cornices, we create plasterwork that gives interiors character and finish.",
    heroImage: makeImage(
      "hero-pop.jpg",
      "Elegant white plaster ceiling with layered recessed design and soft lighting",
    ),
    pricingIntro:
      "POP pricing depends on the design and the space. We prepare a personalised quote once we understand your plans. The main factors are:",
    pricingFactors: [
      "Design complexity",
      "Dimensions and surface area",
      "Decorative details and finishing",
      "Materials and installation requirements",
      "Site conditions and location",
    ],
  },
];

export function getServiceBySlug(slug) {
  return services.find((service) => service.slug === slug);
}
