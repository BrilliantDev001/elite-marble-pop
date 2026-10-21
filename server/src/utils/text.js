// Turns a title into a web-address-friendly slug: "Marble Kitchen Island" -> "marble-kitchen-island"
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Reduces a name to a comparable form so near-duplicates are caught:
// "Kitchen Countertops", "kitchen countertop" and "Kitchen  Countertop!" all match.
// ("&" and "and" are treated the same, and a trailing "s" on each word is ignored.)
export function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/s$/, ""))
    .join(" ");
}
