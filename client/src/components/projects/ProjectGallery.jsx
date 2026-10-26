import { LoaderCircle } from "lucide-react";
import ProjectCard from "./ProjectCard";
import CardGridSkeleton from "../shared/CardGridSkeleton";
import LoadError from "../shared/LoadError";

const GRID = "grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3";
const CARD_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

// Shows the project grid and the loading, error and empty states.
//
// Props:
//   projects      the projects loaded so far
//   status        "loading", "ready" or "error" (for the first page)
//   total         how many projects match in total
//   hasMore       whether "Load more" should be offered
//   loadingMore   true while the next page is loading
//   moreError     set if loading the next page failed
//   hasFilters    true when filters are active (changes the empty-state wording)
//   onLoadMore    loads the next page
//   onClear       clears all filters (used by the empty state)
//   onRetry       tries again after an error
export default function ProjectGallery({
  projects,
  status,
  total,
  hasMore,
  loadingMore,
  moreError,
  hasFilters,
  onLoadMore,
  onClear,
  onRetry,
}) {
  if (status === "loading")
    return <CardGridSkeleton count={6} className={GRID} />;

  if (status === "error")
    return (
      <LoadError message="We could not load the projects." onRetry={onRetry} />
    );

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
  return (
    <div>
      {/* aria-live announces the new count to screen readers when it changes */}
      <p aria-live="polite" className="mb-8 text-sm text-obsidian/80">
        Showing {projects.length} of {total}{" "}
        {total === 1 ? "project" : "projects"}
      </p>

      <div className={GRID}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} sizes={CARD_SIZES} />
        ))}
      </div>

      {moreError && (
        <p
          role="alert"
          className="mt-10 text-center text-sm font-medium text-red-800"
        >
          We could not load more projects. Please try again.
        </p>
      )}

      {hasMore && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-busy={loadingMore}
            className="btn-outline disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingMore ? (
              <>
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="animate-spin"
                />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
