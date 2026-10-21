import { Star } from "lucide-react";
import { getServiceBySlug } from "../../data/services";

// Five stars, filled according to the rating.
// Screen readers get the sentence "5 out of 5 stars" instead of five icons.
export function StarRating({ rating }) {
  return (
    <div
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className="flex gap-1"
    >
      {[1, 2, 3, 4, 5].map((number) => (
        <Star
          key={number}
          size={18}
          aria-hidden="true"
          className={
            number <= rating ? "fill-gold stroke-gold" : "stroke-obsidian/30"
          }
        />
      ))}
    </div>
  );
}

export default function ReviewCard({ review }) {
  const service = getServiceBySlug(review.service);

  return (
    <figure className="flex h-full flex-col border-t-2 border-gold pt-6">
      {/* Always visible on placeholder reviews, so they can never pass as real */}
      {review.isPlaceholder && (
        <p className="mb-4 inline-block self-start bg-obsidian px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-ivory">
          Placeholder review, not a real customer
        </p>
      )}

      <StarRating rating={review.rating} />

      <blockquote className="mt-5 flex-1 font-heading text-2xl leading-snug">
        {review.text}
      </blockquote>

      <figcaption className="mt-6 text-sm">
        <span className="font-semibold">{review.name}</span>
        {service && <span className="text-obsidian/80"> · {service.name}</span>}
      </figcaption>
    </figure>
  );
}
