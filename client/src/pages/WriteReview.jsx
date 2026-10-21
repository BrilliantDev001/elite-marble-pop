import SectionHeading from "../components/shared/SectionHeading";
import ReviewForm from "../components/reviews/ReviewForm";
import usePageMeta from "../hooks/usePageMeta";

export default function WriteReview() {
  usePageMeta(
    "Write a Review",
    "Share your experience of working with ELITE Marble & POP Works Ltd.",
  );

  return (
    <section className="container-page py-14 md:py-20">
      <SectionHeading
        as="h1"
        eyebrow="Customer reviews"
        title="Write a review"
        description="Share your experience of working with us. You do not need an account. Every review is checked by the owner before it appears on the website."
      />

      <div className="mt-12 max-w-2xl">
        <ReviewForm />
      </div>
    </section>
  );
}
