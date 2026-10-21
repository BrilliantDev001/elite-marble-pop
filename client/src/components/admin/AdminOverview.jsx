import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, Images, Inbox, Star } from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";

export default function AdminOverview() {
  usePageMeta("Admin overview");

  const { projects, reviews, enquiries } = useOutletContext();

  // All of these numbers are calculated from the mock data.
  const published = projects.filter(
    (project) => project.status === "published",
  ).length;
  const drafts = projects.filter(
    (project) => project.status === "draft",
  ).length;
  const pending = reviews.filter(
    (review) => review.status === "pending",
  ).length;
  const approved = reviews.filter(
    (review) => review.status === "approved",
  ).length;
  const newEnquiries = enquiries.filter(
    (enquiry) => enquiry.status === "New",
  ).length;

  const cards = [
    {
      to: "/admin/projects",
      icon: Images,
      title: "Projects",
      number: published,
      line: `published${drafts ? `, ${drafts} in draft` : ""}`,
      cta: "Manage projects",
    },
    {
      to: "/admin/reviews",
      icon: Star,
      title: "Reviews",
      number: pending,
      line: `waiting for approval, ${approved} approved`,
      cta: "Moderate reviews",
    },
    {
      to: "/admin/enquiries",
      icon: Inbox,
      title: "Enquiries",
      number: newEnquiries,
      line: `new, ${enquiries.length} in total`,
      cta: "View enquiries",
    },
  ];

  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">Overview</h1>
      <p className="mt-3 max-w-2xl text-obsidian/80">
        Your everyday tasks in one place. Counts below are calculated from the
        mock data in this prototype.
      </p>

      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <li key={card.to}>
            <Link
              to={card.to}
              className="group flex h-full flex-col border border-obsidian/25 p-6 transition-colors hover:border-obsidian"
            >
              <card.icon size={24} strokeWidth={1.5} aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-medium">{card.title}</h2>
              <p className="mt-3">
                <span className="font-heading text-5xl font-medium">
                  {card.number}
                </span>{" "}
                <span className="text-sm text-obsidian/80">{card.line}</span>
              </p>
              <span className="mt-6 inline-flex items-center gap-2 border-b border-gold pb-0.5 text-xs font-semibold uppercase tracking-[0.12em] self-start">
                {card.cta}
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-obsidian/80">
        Also available:{" "}
        <Link
          to="/admin/categories"
          className="font-semibold underline underline-offset-4"
        >
          Categories
        </Link>{" "}
        and{" "}
        <Link
          to="/admin/settings"
          className="font-semibold underline underline-offset-4"
        >
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
