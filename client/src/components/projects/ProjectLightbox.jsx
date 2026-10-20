import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Full-screen photo viewer for ONE project's photos.
//
// Props:
//   images        the project's image objects, cover first
//   startIndex    which photo to open on
//   title         the project title (used for the viewer's accessible name)
//   onClose()     called when the visitor closes the viewer
//
// Keyboard: Left/Right arrows change photo, Escape closes.
// The parent only renders this component while the viewer is open.
export default function ProjectLightbox({
  images,
  startIndex = 0,
  title,
  onClose,
}) {
  const dialogRef = useRef(null);
  const [index, setIndex] = useState(startIndex);

  const total = images.length;
  const image = images[index];

  // Open as a modal when this component appears. While it is open:
  // the page behind it cannot be scrolled or tabbed into, and when it closes
  // the browser returns focus to the button that opened it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog?.open) dialog.close();
    };
  }, []);

  function showPrevious() {
    setIndex((current) => (current - 1 + total) % total);
  }

  function showNext() {
    setIndex((current) => (current + 1) % total);
  }

  function handleKeyDown(event) {
    if (total < 2) return;
    if (event.key === "ArrowLeft") showPrevious();
    if (event.key === "ArrowRight") showNext();
  }

  const arrowClass =
    "absolute top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-ivory/50 bg-obsidian/70 transition-colors hover:bg-ivory hover:text-obsidian";

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${title}, photo viewer`}
      // Escape fires "cancel". We hand control to the parent instead of letting the browser close it.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none bg-obsidian p-0 text-ivory backdrop:bg-obsidian"
    >
      <div className="flex h-full flex-col">
        {/* The close button comes first, so it receives focus when the viewer opens */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-sm">
            <span className="font-semibold">{title}</span>
            <span aria-live="polite" className="ml-3 text-ivory/80">
              Photo {index + 1} of {total}
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
            className="inline-flex h-11 w-11 items-center justify-center border border-ivory/50 transition-colors hover:bg-ivory hover:text-obsidian"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Clicking the empty dark area around the photo also closes the viewer */}
        <div
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20"
        >
          {total > 1 && (
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Previous photo"
              className={`${arrowClass} left-2 sm:left-4`}
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
          )}

          {/* A plain <img> here (not SiteImage) so the whole photo shows, uncropped.
              Later we will point this at a larger optimised version of the photo. */}
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            decoding="async"
            className="max-h-[calc(100dvh-10rem)] max-w-full object-contain"
          />

          {total > 1 && (
            <button
              type="button"
              onClick={showNext}
              aria-label="Next photo"
              className={`${arrowClass} right-2 sm:right-4`}
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Caption: only when the photo has one. The reserved height stops the photo jumping. */}
        <p className="min-h-16 px-4 py-4 text-center text-sm text-ivory/90">
          {image.caption}
        </p>
      </div>
    </dialog>
  );
}
