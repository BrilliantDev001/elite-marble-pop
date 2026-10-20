import { makeImage } from "./images";
import { getServiceBySlug } from "./services";

// The three hero themes: marble, POP, and a finished interior with both.
// The marble and POP slides reuse the service hero images, so their alt text
// is only written once (in services.js).
export const heroSlides = [
  {
    id: "marble",
    label: "Marble Works",
    image: getServiceBySlug("marble").heroImage,
  },
  {
    id: "pop",
    label: "POP Works",
    image: getServiceBySlug("pop").heroImage,
  },
  {
    id: "interior",
    label: "The finished space",
    image: makeImage(
      "hero-interior.jpg",
      "Finished interior with a marble floor and a plaster ceiling",
    ),
  },
];
