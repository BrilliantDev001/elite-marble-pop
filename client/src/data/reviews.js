// ONE placeholder review, used only to test the review card and section styling.
// It is clearly labelled as a placeholder and is NOT a real customer review.
//
// Review rules (enforced properly by the backend later):
// - status: "pending" | "approved" | "rejected". Only "approved" can show publicly.
// - featured: only an approved AND featured review appears on the home page.
// - Approving and featuring are two separate actions.

export const reviews = [
  {
    id: "r1",
    name: "Sample Customer",
    rating: 5,
    text: "This is a placeholder review used to check the layout and styling of this section. Real customer reviews will appear here once the owner has approved them.",
    service: "marble",
    projectSlug: null,
    status: "approved",
    featured: true,
    isPlaceholder: true,
    createdAt: "2026-03-01",
  },
];

// Approved reviews only. The public Reviews page uses this.
export function getApprovedReviews() {
  return reviews.filter((review) => review.status === "approved");
}

// Approved AND featured reviews. The home page uses this.
export function getFeaturedReviews(limit = 3) {
  return getApprovedReviews()
    .filter((review) => review.featured)
    .slice(0, limit);
}
