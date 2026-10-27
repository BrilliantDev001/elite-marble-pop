import { useState } from "react";
import { resizedUrl, srcSetFor } from "../../utils/images";

// Renders one image object: { src, alt, caption, isPlaceholder }.
//
// IMPORTANT: this component fills its parent box, so the caller must give it a
// shape, for example className="aspect-[4/3]" or "aspect-video". Reserving the
// shape up front stops the page from jumping while images load.
//
// Props:
//   image         the image object
//   className     sizing/shape classes for the box, e.g. "aspect-[4/3]"
//   loading       "lazy" (default) or "eager" for images at the top of the page
//   fetchPriority "high" for the first hero image, otherwise leave as "auto"
//   sizes         how wide the image is shown, e.g. "(min-width: 1024px) 33vw, 100vw".
//                 The browser uses it to pick the smallest suitable version of a hosted photo.
//   fit           "cover" (default, fills the box) or "contain" (shows the whole image)
export default function SiteImage({
  image,
  className = "",
  loading = "lazy",
  fetchPriority = "auto",
  sizes,
  fit = "cover",
}) {
  // Remember which src failed to load. When the src changes, the fallback resets itself.
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = !image || failedSrc === image.src;
  const alt = image?.alt || "";

  // Developer safety net: warn in the console if alt text is ever missing.
  if (import.meta.env.DEV && !alt) {
    console.warn("SiteImage: every image needs alt text.", image);
  }

  // Hosted photos come in several widths. Local placeholder photos have no srcset.
  const srcSet = image ? srcSetFor(image.src) : undefined;

  return (
    <div className={`relative overflow-hidden bg-stone/20 ${className}`}>
      {failed ? (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-obsidian/70"
        >
          Image unavailable
        </div>
      ) : (
        <img
          src={resizedUrl(image.src, 800)}
          srcSet={srcSet}
          sizes={srcSet ? (sizes ?? "100vw") : sizes}
          alt={alt}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          onError={() => setFailedSrc(image.src)}
          className={`absolute inset-0 h-full w-full ${
            fit === "contain" ? "object-contain" : "object-cover"
          }`}
        />
      )}

      {/* Shown only while developing, so stock photos are never mistaken for real work.
          It disappears automatically in the production build. */}
      {import.meta.env.DEV && image?.isPlaceholder && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-2 bg-obsidian/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-ivory"
        >
          Placeholder
        </span>
      )}
    </div>
  );
}
