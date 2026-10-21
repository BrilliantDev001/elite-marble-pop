import { Link } from "react-router-dom";
import SectionHeading from "../components/shared/SectionHeading";
import ReviewCard from "../components/reviews/ReviewCard";
import usePageMeta from "../hooks/usePageMeta";
import { getApprovedReviews } from "../data/reviews";

export default function Reviews() {
  usePageMeta(
    "Customer Reviews",
    "Read reviews from customers of ELITE Marble & POP Works Ltd.",
  );

  // Approved reviews only. Pending and rejected reviews never reach this page.
  const reviews = getApprovedReviews();

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

      {reviews.length > 0 ? (
        <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="mt-14 max-w-xl border border-obsidian/15 p-8">
          <p className="font-heading text-2xl">No reviews yet.</p>
          <p className="mt-2 text-obsidian/80">
            Reviews appear here once they have been submitted and approved. If
            we have worked with you, we would value your feedback.
          </p>
        </div>
      )}
    </section>
  );
}
