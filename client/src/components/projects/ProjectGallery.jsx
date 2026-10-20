import { useState } from "react";
import ProjectCard from "./ProjectCard";

const PAGE_SIZE = 6; // how many projects show at first, and per "Load more" click
const GRID = "grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3";
const CARD_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

// Props:
//   projects     the already-filtered list of projects
//   status       "ready" (default), "loading" or "error"
//   hasFilters   true when filters are active (changes the empty-state wording)
//   onClear      clears all filters (used by the empty state)
//   onRetry      tries again after an error
//
// The Gallery page gives this component a "key" that changes with the filters,
// so the "how many are showing" counter resets whenever the filters change.
export default function ProjectGallery({
  projects,
  status = "ready",
  hasFilters = false,
  onClear,
  onRetry,
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ---------- Loading: placeholder cards ----------
  if (status === "loading") {
    return (
      <div className={GRID}>
        <p className="sr-only" role="status">
          Loading projects...
        </p>
        {Array.from({ length: PAGE_SIZE }, (_, index) => (
          <div key={index} aria-hidden="true" className="animate-pulse">
            <div className="aspect-[4/3] bg-stone/20" />
            <div className="mt-4 h-6 w-2/3 bg-stone/20" />
            <div className="mt-2 h-4 w-1/3 bg-stone/20" />
          </div>
        ))}
      </div>
    );
  }

  // ---------- Error ----------
  if (status === "error") {
    return (
      <div role="alert" className="max-w-xl border border-obsidian/20 p-8">
        <p className="font-heading text-2xl">We could not load the projects.</p>
        <p className="mt-2 text-obsidian/80">
          Please check your connection and try again.
        </p>
        <button type="button" onClick={onRetry} className="btn-outline mt-6">
          Try again
        </button>
      </div>
    );
  }

  // ---------- Empty ----------
  if (projects.length === 0) {
    return (
      <div className="max-w-xl border border-obsidian/20 p-8">
        <p className="font-heading text-2xl">
          {hasFilters
            ? "No projects match these filters yet."
            : "No projects have been published yet."}
        </p>
        <p className="mt-2 text-obsidian/80">
          {hasFilters
            ? "Try a different category, or clear the filters to see everything."
            : "Published projects will appear here."}
        </p>
        {hasFilters && (
          <button type="button" onClick={onClear} className="btn-outline mt-6">
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  // ---------- Ready: the grid ----------
  const visible = projects.slice(0, visibleCount);

  return (
    <div>
      {/* aria-live announces the new count to screen readers when it changes */}
      <p aria-live="polite" className="mb-8 text-sm text-obsidian/80">
        Showing {visible.length} of {projects.length}{" "}
        {projects.length === 1 ? "project" : "projects"}
      </p>

      <div className={GRID}>
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} sizes={CARD_SIZES} />
        ))}
      </div>

      {visibleCount < projects.length && (
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="btn-outline"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
