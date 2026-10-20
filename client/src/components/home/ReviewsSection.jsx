import { Link } from "react-router-dom";
import SectionHeading from "../shared/SectionHeading";
import ReviewCard from "../reviews/ReviewCard";
import { getFeaturedReviews } from "../../data/reviews";

// Shows only approved AND featured reviews. With none, it shows a calm empty state.
export default function ReviewsSection() {
  const reviews = getFeaturedReviews(3);

  return (
    <section className="bg-obsidian/[0.04] py-20 md:py-28">
      <div className="container-page">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Customer reviews"
            title="In our customers' words."
          />
          <Link
            to="/reviews/write"
            className="btn-outline btn-sm self-start md:self-auto"
          >
            Write a review
          </Link>
        </div>

        {reviews.length > 0 ? (
          <>
            <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <Link
              to="/reviews"
              className="mt-12 inline-block border-b-2 border-gold pb-1 text-sm font-semibold uppercase tracking-[0.12em]"
            >
              Read more reviews
            </Link>
          </>
        ) : (
          <div className="mt-14 max-w-xl border border-obsidian/15 p-8">
            <p className="font-heading text-2xl">No reviews yet.</p>
            <p className="mt-2 text-obsidian/80">
              Reviews appear here once they have been submitted and approved.
              Have we worked with you? We would value your feedback.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
