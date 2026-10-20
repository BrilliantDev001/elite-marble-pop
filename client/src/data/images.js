// Every image in the site is an object: { src, alt, caption, isPlaceholder }.
// Components never hardcode image paths or alt text; they read them from the data files.

// Where the temporary placeholder photos live (client/public/placeholders/).
const PLACEHOLDER_FOLDER = "/placeholders/";

// Builds an image object for a local placeholder photo.
// Usage: makeImage("hero-marble.jpg", "Polished white marble wall with grey veining")
export function makeImage(fileName, alt, caption = "") {
  return {
    src: PLACEHOLDER_FOLDER + fileName,
    alt,
    caption,
    isPlaceholder: true,
  };
}
