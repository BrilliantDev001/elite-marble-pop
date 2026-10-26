import { Link } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import SectionHeading from "../components/shared/SectionHeading";
import LoadError from "../components/shared/LoadError";
import ReviewCard from "../components/reviews/ReviewCard";
import usePagedApi from "../hooks/usePagedApi";
import usePageMeta from "../hooks/usePageMeta";

const PAGE_SIZE = 12;

export default function Reviews() {
  usePageMeta(
    "Customer Reviews",
    "Read reviews from customers of ELITE Marble & POP Works Ltd.",
  );

  // The API only ever returns approved reviews. Pending and rejected ones never reach this page.
  const list = usePagedApi("/api/reviews", {}, PAGE_SIZE);

  return (
    <section className="container-page py-14 md:py-20">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          as="h1"
          eyebrow="Customer reviews"
          title="What customers say"
          description="Reviews are checked by the owner before they are published."
        />
        <Link
          to="/reviews/write"
          className="btn-primary self-start md:self-auto"
        >
          Write a review
        </Link>
      </div>

      {list.status === "loading" && (
        <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <p className="sr-only" role="status">
            Loading reviews...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-56 animate-pulse bg-stone/20"
            />
          ))}
        </div>
      )}

      {list.status === "error" && (
        <div className="mt-14">
          <LoadError
            message="We could not load the reviews."
            onRetry={list.reload}
          />
        </div>
      )}

      {list.status === "ready" &&
        (list.items.length > 0 ? (
          <>
            <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {list.items.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {list.moreError && (
              <p
                role="alert"
                className="mt-10 text-center text-sm font-medium text-red-800"
              >
                We could not load more reviews. Please try again.
              </p>
            )}

            {list.hasMore && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={list.loadMore}
                  disabled={list.loadingMore}
                  aria-busy={list.loadingMore}
                  className="btn-outline disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {list.loadingMore ? (
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
        ) : (
          <div className="mt-14 max-w-xl border border-obsidian/15 p-8">
            <p className="font-heading text-2xl">No reviews yet.</p>
            <p className="mt-2 text-obsidian/80">
              Reviews appear here once they have been submitted and approved. If
              we have worked with you, we would value your feedback.
            </p>
          </div>
        ))}
    </section>
  );
}
