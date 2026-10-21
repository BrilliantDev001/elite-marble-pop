import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, Star, X } from "lucide-react";
import { StarRating } from "../reviews/ReviewCard";
import usePageMeta from "../../hooks/usePageMeta";
import { getServiceBySlug } from "../../data/services";
import { formatDate } from "../../data/adminMock";

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

  const { reviews, setReviews, projects } = useOutletContext();
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState("");
  const messageRef = useRef(null);

  const countFor = (value) =>
    value === "all"
      ? reviews.length
      : reviews.filter((review) => review.status === value).length;

  const shown = reviews
    .filter((review) => filter === "all" || review.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Applies a change to one review and announces what happened.
  // If the review disappears from the current tab (for example, approving
  // it while viewing "Pending"), focus moves to the message so keyboard
  // users do not lose their place.
  function updateReview(review, changes, text) {
    setReviews((current) =>
      current.map((item) =>
        item.id === review.id ? { ...item, ...changes } : item,
      ),
    );
    setMessage(text);

    const newStatus = changes.status ?? review.status;
    if (filter !== "all" && newStatus !== filter) messageRef.current?.focus();
  }

  // Approving and featuring are two separate actions.
  function approve(review) {
    updateReview(
      review,
      { status: "approved" },
      `Approved the review by ${review.name}. It is public but not featured on the home page.`,
    );
  }

  // A rejected review must never appear publicly, so it is also un-featured.
  function reject(review) {
    updateReview(
      review,
      { status: "rejected", featured: false },
      `Rejected the review by ${review.name}. It is hidden from the public site.`,
    );
  }

  function toggleFeatured(review) {
    const next = !review.featured;
    updateReview(
      review,
      { featured: next },
      next
        ? `Featured the review by ${review.name} on the home page.`
        : `Removed the review by ${review.name} from the home page. It stays approved.`,
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">Reviews</h1>
      <p className="mt-3 max-w-2xl text-obsidian/80">
        Only approved reviews are public. Only approved reviews that you also
        feature appear on the home page (up to 3 are shown). Approving and
        featuring are separate choices.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-obsidian/70">
        Prototype note: changes here do not alter the public pages of this demo
        site. They only show how the admin will work.
      </p>

      {/* Filter tabs */}
      <div
        className="mt-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter reviews by status"
      >
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-medium transition-colors ${
              filter === item.value
                ? "border-obsidian bg-obsidian text-ivory"
                : "border-obsidian/30 hover:border-obsidian"
            }`}
          >
            {item.label}
            <span className="text-xs opacity-80">({countFor(item.value)})</span>
          </button>
        ))}
      </div>

      {/* Result of the last action */}
      <p
        ref={messageRef}
        role="status"
        tabIndex={-1}
        className={`mt-6 border-l-2 border-gold pl-4 text-sm focus:outline-none ${
          message ? "" : "hidden"
        }`}
      >
        {message}
      </p>

      {shown.length > 0 ? (
        <ul className="mt-8 space-y-6">
          {shown.map((review) => {
            const service = getServiceBySlug(review.service);
            const project = projects.find(
              (item) => item.slug === review.projectSlug,
            );

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
                    {review.isPlaceholder && (
                      <span className="text-xs text-obsidian/70">
                        (placeholder or mock review)
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
                    {project && (
                      <span className="text-obsidian/80">
                        {" "}
                        · About: {project.title}
                      </span>
                    )}
                    <span className="text-obsidian/80">
                      {" "}
                      · {formatDate(review.createdAt)}
                    </span>
                  </p>

                  <p className="mt-4 max-w-3xl font-heading text-xl leading-snug">
                    {review.text}
                  </p>

                  {/* Moderation and featuring are separate controls */}
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-obsidian/15 pt-5">
                    {review.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => approve(review)}
                        aria-label={`Approve review by ${review.name}`}
                        className="btn-primary btn-sm"
                      >
                        <Check size={14} aria-hidden="true" />
                        Approve
                      </button>
                    )}

                    {review.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => reject(review)}
                        aria-label={`Reject review by ${review.name}`}
                        className="btn-outline btn-sm"
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
                        aria-label={`${review.featured ? "Remove from home page" : "Feature on home page"}: review by ${review.name}`}
                        className="btn-outline btn-sm"
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
      )}
    </div>
  );
}
