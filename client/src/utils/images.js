// ImageKit can resize a photo on the fly: adding ?tr=w-800 to its address returns a version
// 800 pixels wide (the height follows automatically). It also serves modern formats such as
// WebP or AVIF to browsers that support them. This lets pages load small versions of big photos.
//
// Only photos hosted on ik.imagekit.io are resized. Local placeholder photos are left alone.

const WIDTHS = [400, 800, 1200, 1600];

function canResize(src) {
  return (
    typeof src === "string" &&
    src.startsWith("https://ik.imagekit.io/") &&
    !src.includes("?")
  );
}

// The photo at a given width (or the original address, when it cannot be resized).
export function resizedUrl(src, width) {
  return canResize(src) ? `${src}?tr=w-${width}` : src;
}

// A list of widths for the browser to choose from, for the <img srcset="..."> attribute.
export function srcSetFor(src) {
  if (!canResize(src)) return undefined;
  return WIDTHS.map((width) => `${resizedUrl(src, width)} ${width}w`).join(
    ", ",
  );
}

// The large version used in the lightbox.
export function largeImageUrl(src) {
  return resizedUrl(src, 1600);
}
