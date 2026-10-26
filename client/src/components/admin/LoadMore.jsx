import { LoaderCircle } from "lucide-react";

// The "Load more" button at the end of an admin list, with its own error message.
export default function LoadMore({
  hasMore,
  loadingMore,
  moreError,
  onLoadMore,
}) {
  return (
    <>
      {moreError && (
        <p
          role="alert"
          className="mt-8 text-center text-sm font-medium text-red-800"
        >
          We could not load more. Please try again.
        </p>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
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
    </>
  );
}
