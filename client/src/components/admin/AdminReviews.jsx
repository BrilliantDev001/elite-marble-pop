import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, Star, X } from "lucide-react";
import { StarRating } from "../reviews/ReviewCard";
import FilterTabs from "./FilterTabs";
import AdminFeedback from "./AdminFeedback";
import LoadMore from "./LoadMore";
import LoadError from "../shared/LoadError";
import usePagedApi from "../../hooks/usePagedApi";
import usePageMeta from "../../hooks/usePageMeta";
import { apiRequest } from "../../services/api";
import { getServiceBySlug } from "../../data/services";
import { formatDate } from "../../utils/dates";

const FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

// The status is always written out in words, never shown by colour alone.
function StatusBadge({ status }) {
  const styles = {
    pending: "border-obsidian/50",
    approved: "border-obsidian bg-obsidian text-ivory",
    rejected: "border-red-800 text-red-800",
  };
  return (
    <span
      className={`inline-block border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function AdminReviews() {
  usePageMeta("Admin: Reviews");

  const { counts, refreshCounts } = useOutletContext();
  const [filter, setFilter] = useState("pending");
  const [feedback, setFeedback] = useState(null);
  const [busyId, setBusyId] = useState(null); // the review an action is running for
  const feedbackRef = useRef(null);

  // The reviews for the chosen tab, loaded from the server (it only sends what we ask for).
  const list = usePagedApi(
    "/api/admin/reviews",
    { status: filter === "all" ? "" : filter },
    20,
  );

  const options = FILTERS.map((item) => ({
    ...item,
    count: counts?.reviews[item.value],
  }));

  // Sends one moderation action. The SERVER applies the rules and answers with the updated review.
  async function runAction(review, action, successText) {
    if (busyId) return;
    setBusyId(review.id);
    setFeedback(null);

    try {
      const data = await apiRequest(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        body: { action },
      });
      const updated = data.review;

      // The review stays in this tab only if it still matches the tab's status.
      const stays = filter === "all" || updated.status === filter;
      list.patchItems((items) =>
        stays
          ? items.map((item) => (item.id === updated.id ? updated : item))
          : items.filter((item) => item.id !== updated.id),
      );

      setFeedback({ type: "success", text: successText });
      refreshCounts();

      // The button that was clicked may have moved or disappeared, so move focus to the message.
      if (!stays || action === "approve" || action === "reject")
        feedbackRef.current?.focus();
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
      feedbackRef.current?.focus();
    } finally {
      setBusyId(null);
    }
  }

  const approve = (review) =>
    runAction(
      review,
      "approve",
      `Approved the review by ${review.name}. It is public but not featured on the home page.`,
    );
  const reject = (review) =>
    runAction(
      review,
      "reject",
      `Rejected the review by ${review.name}. It is hidden from the public site.`,
    );
  const toggleFeatured = (review) =>
    runAction(
      review,
      review.featured ? "unfeature" : "feature",
      review.featured
        ? `Removed the review by ${review.name} from the home page. It stays approved.`
        : `Featured the review by ${review.name} on the home page.`,
    );

  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">Reviews</h1>
      <p className="mt-3 max-w-2xl text-obsidian/80">
        Only approved reviews are public. Only approved reviews that you also
        feature appear on the home page (up to 3 are shown). Approving and
        featuring are separate choices.
      </p>

      <FilterTabs
        label="Filter reviews by status"
        options={options}
        value={filter}
        onChange={setFilter}
      />

      <AdminFeedback feedback={feedback} ref={feedbackRef} />

      {list.status === "loading" && (
        <div className="mt-8 space-y-6">
          <p className="sr-only" role="status">
            Loading reviews...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-40 animate-pulse bg-stone/20"
            />
          ))}
        </div>
      )}

      {list.status === "error" && (
        <div className="mt-8">
          <LoadError
            message="We could not load the reviews."
            onRetry={list.reload}
          />
        </div>
      )}

      {list.status === "ready" &&
        (list.items.length > 0 ? (
          <>
            <ul className="mt-8 space-y-6">
              {list.items.map((review) => {
                const service = getServiceBySlug(review.service);
                const busy = busyId === review.id;

                return (
                  <li key={review.id}>
                    <article className="border border-obsidian/25 p-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <StarRating rating={review.rating} />
                        <StatusBadge status={review.status} />
                        {review.featured && (
                          <span className="inline-flex items-center gap-1.5 border border-gold bg-gold/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider">
                            <Star size={12} aria-hidden="true" />
                            On home page
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-sm">
                        <span className="font-semibold">{review.name}</span>
                        {service && (
                          <span className="text-obsidian/80">
                            {" "}
                            · {service.name}
                          </span>
                        )}
                        {review.projectSlug && (
                          <span className="text-obsidian/80">
                            {" "}
                            · About: {review.projectTitle ?? review.projectSlug}
                          </span>
                        )}
                        <span className="text-obsidian/80">
                          {" "}
                          · {formatDate(review.createdAt)}
                        </span>
                      </p>

                      <p className="mt-4 max-w-3xl whitespace-pre-line font-heading text-xl leading-snug">
                        {review.text}
                      </p>

                      {/* Moderation and featuring are separate controls */}
                      <div className="mt-6 flex flex-wrap gap-3 border-t border-obsidian/15 pt-5">
                        {review.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => approve(review)}
                            disabled={busy}
                            aria-busy={busy}
                            aria-label={`Approve review by ${review.name}`}
                            className="btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <Check size={14} aria-hidden="true" />
                            Approve
                          </button>
                        )}

                        {review.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => reject(review)}
                            disabled={busy}
                            aria-busy={busy}
                            aria-label={`Reject review by ${review.name}`}
                            className="btn-outline btn-sm disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <X size={14} aria-hidden="true" />
                            Reject
                          </button>
                        )}

                        {/* Featuring is only possible for approved reviews */}
                        {review.status === "approved" && (
                          <button
                            type="button"
                            onClick={() => toggleFeatured(review)}
                            disabled={busy}
                            aria-busy={busy}
                            aria-label={`${review.featured ? "Remove from home page" : "Feature on home page"}: review by ${review.name}`}
                            className="btn-outline btn-sm disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <Star size={14} aria-hidden="true" />
                            {review.featured
                              ? "Remove from home page"
                              : "Feature on home page"}
                          </button>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>

            <LoadMore
              hasMore={list.hasMore}
              loadingMore={list.loadingMore}
              moreError={list.moreError}
              onLoadMore={list.loadMore}
            />
          </>
        ) : (
          <div className="mt-8 max-w-xl border border-obsidian/20 p-8">
            <p className="font-heading text-2xl">
              {filter === "all" ? "No reviews yet." : `No ${filter} reviews.`}
            </p>
            <p className="mt-2 text-obsidian/80">
              {filter === "pending"
                ? "New reviews will wait here until you approve or reject them."
                : "Reviews will appear here as they are moderated."}
            </p>
          </div>
        ))}
    </div>
  );
}
