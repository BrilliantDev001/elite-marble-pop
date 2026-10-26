import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, Images, Inbox, Star } from "lucide-react";
import LoadError from "../shared/LoadError";
import usePageMeta from "../../hooks/usePageMeta";

export default function AdminOverview() {
  usePageMeta("Admin overview");

  const { counts, countsFailed, refreshCounts } = useOutletContext();

  // Until the real numbers arrive, a dash is shown. Nothing is ever invented.
  const cards = [
    {
      to: "/admin/projects",
      icon: Images,
      title: "Projects",
      number: counts?.projects.published,
      line: counts
        ? `published${counts.projects.draft ? `, ${counts.projects.draft} in draft` : ""}${
            counts.projects.archived
              ? `, ${counts.projects.archived} archived`
              : ""
          }`
        : "published",
      cta: "Manage projects",
    },
    {
      to: "/admin/reviews",
      icon: Star,
      title: "Reviews",
      number: counts?.reviews.pending,
      line: counts
        ? `waiting for approval, ${counts.reviews.approved} approved`
        : "waiting for approval",
      cta: "Moderate reviews",
    },
    {
      to: "/admin/enquiries",
      icon: Inbox,
      title: "Enquiries",
      number: counts?.enquiries.New,
      line: counts ? `new, ${counts.enquiries.all} in total` : "new",
      cta: "View enquiries",
    },
  ];

  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">Overview</h1>
      <p className="mt-3 max-w-2xl text-obsidian/80">
        Your everyday tasks in one place. These numbers are your real data.
      </p>

      {countsFailed && !counts ? (
        <div className="mt-10">
          <LoadError
            message="We could not load your numbers."
            onRetry={refreshCounts}
          />
        </div>
      ) : (
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
                    {card.number ?? "–"}
                  </span>{" "}
                  <span className="text-sm text-obsidian/80">{card.line}</span>
                </p>
                <span className="mt-6 inline-flex items-center gap-2 self-start border-b border-gold pb-0.5 text-xs font-semibold uppercase tracking-[0.12em]">
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
      )}

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
