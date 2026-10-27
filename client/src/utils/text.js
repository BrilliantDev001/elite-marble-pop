// Turns a title into a web-address-friendly slug: "Marble Kitchen Island" -> "marble-kitchen-island"
// (The server uses the same rule and checks again.)
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
