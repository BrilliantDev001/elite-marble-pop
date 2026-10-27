import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { ExternalLink, Plus, Star } from "lucide-react";
import SiteImage from "../shared/SiteImage";
import LoadError from "../shared/LoadError";
import FilterTabs from "./FilterTabs";
import AdminFeedback from "./AdminFeedback";
import LoadMore from "./LoadMore";
import useApi from "../../hooks/useApi";
import usePagedApi from "../../hooks/usePagedApi";
import usePageMeta from "../../hooks/usePageMeta";
import { apiRequest } from "../../services/api";
import { toImage } from "../../services/mappers";
import { getServiceBySlug } from "../../data/services";
import { formatDate } from "../../utils/dates";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

// The status is always written out in words, never shown by colour alone.
function StatusBadge({ status }) {
  const styles = {
    published: "border-obsidian bg-obsidian text-ivory",
    draft: "border-obsidian/50",
    archived: "border-obsidian/30 text-obsidian/70",
  };
  return (
    <span
      className={`inline-block border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function AdminProjects() {
  usePageMeta("Admin: Projects");

  const location = useLocation();
  const navigate = useNavigate();
  const { counts, refreshCounts } = useOutletContext();

  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null); // the project an action is running for
  const feedbackRef = useRef(null);

  // After saving in the form, we arrive here with a message to show.
  const [feedback, setFeedback] = useState(() =>
    location.state?.message
      ? { type: "success", text: location.state.message }
      : null,
  );

  useEffect(() => {
    if (location.state?.message) {
      feedbackRef.current?.focus();
      // Clear the message from the page history so a refresh does not show it again.
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  // The projects for the chosen tab (the server sends only what we ask for), and the category
  // names (including archived categories) so each project shows a readable name.
  const list = usePagedApi(
    "/api/admin/projects",
    { status: filter === "all" ? "" : filter },
    20,
  );
  const categoriesRequest = useApi("/api/admin/categories");
  const categoryNames = new Map(
    (categoriesRequest.data?.items ?? []).map((item) => [item.slug, item.name]),
  );

  const options = FILTERS.map((item) => ({
    ...item,
    count: counts?.projects[item.value],
  }));

  // Sends one change. The SERVER applies it and answers with the updated project.
  async function runAction(project, changes, successText) {
    if (busyId) return;
    setBusyId(project.id);
    setFeedback(null);

    try {
      const data = await apiRequest(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        body: changes,
      });
      const updated = data.project;

      // The project stays in this tab only if it still matches the tab's status.
      const stays = filter === "all" || updated.status === filter;
      list.patchItems((items) =>
        stays
          ? items.map((item) => (item.id === updated.id ? updated : item))
          : items.filter((item) => item.id !== updated.id),
      );

      setFeedback({ type: "success", text: successText });
      refreshCounts();

      // The button that was clicked may have moved or disappeared, so move focus to the message.
      if (!stays || changes.status) feedbackRef.current?.focus();
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
      feedbackRef.current?.focus();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-medium md:text-5xl">Projects</h1>
          <p className="mt-3 max-w-2xl text-obsidian/80">
            A project is one completed job, with one cover photo and optional
            extra photos. Only published projects appear on the public website.
          </p>
        </div>
        <Link
          to="/admin/projects/new"
          className="btn-primary self-start md:self-auto"
        >
          <Plus size={16} aria-hidden="true" />
          Add project
        </Link>
      </div>

      <FilterTabs
        label="Filter projects by status"
        options={options}
        value={filter}
        onChange={setFilter}
      />

      <AdminFeedback feedback={feedback} ref={feedbackRef} />

      {list.status === "loading" && (
        <div className="mt-8 space-y-5">
          <p className="sr-only" role="status">
            Loading projects...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-36 animate-pulse bg-stone/20"
            />
          ))}
        </div>
      )}

      {list.status === "error" && (
        <div className="mt-8">
          <LoadError
            message="We could not load the projects."
            onRetry={list.reload}
          />
        </div>
      )}

      {list.status === "ready" &&
        (list.items.length > 0 ? (
          <>
            <ul className="mt-8 space-y-5">
              {list.items.map((project) => {
                const service = getServiceBySlug(project.service);
                const photoCount = 1 + project.images.length;
                const busy = busyId === project.id;
                const disabledClass =
                  "disabled:cursor-not-allowed disabled:opacity-70";

                return (
                  <li key={project.id}>
                    <article className="flex flex-col gap-5 border border-obsidian/25 p-5 sm:flex-row">
                      <SiteImage
                        image={toImage(project.coverImage)}
                        className="h-40 w-full shrink-0 sm:h-28 sm:w-40"
                        sizes="160px"
                      />

                      <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-medium">
                          {project.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={project.status} />
                          {project.featured && (
                            <span className="inline-flex items-center gap-1.5 border border-gold bg-gold/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider">
                              <Star size={12} aria-hidden="true" />
                              Featured
                            </span>
                          )}
                          {project.isSample && (
                            <span className="text-xs text-obsidian/70">
                              (sample project)
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-obsidian/80">
                          {service?.shortName} ·{" "}
                          {categoryNames.get(project.category) ??
                            project.category}{" "}
                          · {photoCount} {photoCount === 1 ? "photo" : "photos"}{" "}
                          · Updated {formatDate(project.updatedAt)}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            to={`/admin/projects/${project.id}`}
                            aria-label={`Edit ${project.title}`}
                            className="btn-outline btn-sm"
                          >
                            Edit
                          </Link>

                          {project.status === "draft" && (
                            <button
                              type="button"
                              disabled={busy}
                              aria-busy={busy}
                              aria-label={`Publish ${project.title}`}
                              onClick={() =>
                                runAction(
                                  project,
                                  { status: "published" },
                                  `Published "${project.title}".`,
                                )
                              }
                              className={`btn-primary btn-sm ${disabledClass}`}
                            >
                              Publish
                            </button>
                          )}

                          {project.status === "published" && (
                            <button
                              type="button"
                              disabled={busy}
                              aria-busy={busy}
                              aria-label={`Unpublish ${project.title}`}
                              onClick={() =>
                                runAction(
                                  project,
                                  { status: "draft" },
                                  `Unpublished "${project.title}". It is now a draft and hidden from the public.`,
                                )
                              }
                              className={`btn-outline btn-sm ${disabledClass}`}
                            >
                              Unpublish
                            </button>
                          )}

                          {project.status === "archived" && (
                            <button
                              type="button"
                              disabled={busy}
                              aria-busy={busy}
                              aria-label={`Restore ${project.title} as a draft`}
                              onClick={() =>
                                runAction(
                                  project,
                                  { status: "draft" },
                                  `Restored "${project.title}" as a draft.`,
                                )
                              }
                              className={`btn-outline btn-sm ${disabledClass}`}
                            >
                              Restore as draft
                            </button>
                          )}

                          {project.status !== "archived" && (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                aria-busy={busy}
                                aria-label={`${project.featured ? "Remove from featured" : "Feature"}: ${project.title}`}
                                onClick={() =>
                                  runAction(
                                    project,
                                    { featured: !project.featured },
                                    project.featured
                                      ? `"${project.title}" is no longer featured.`
                                      : `"${project.title}" is now featured. It appears on the home page once published.`,
                                  )
                                }
                                className={`btn-outline btn-sm ${disabledClass}`}
                              >
                                <Star size={14} aria-hidden="true" />
                                {project.featured ? "Unfeature" : "Feature"}
                              </button>

                              <button
                                type="button"
                                disabled={busy}
                                aria-busy={busy}
                                aria-label={`Archive ${project.title}`}
                                onClick={() =>
                                  runAction(
                                    project,
                                    { status: "archived" },
                                    `Archived "${project.title}". It is hidden from the public but not deleted. You can restore it any time.`,
                                  )
                                }
                                className={`btn-outline btn-sm ${disabledClass}`}
                              >
                                Archive
                              </button>
                            </>
                          )}

                          {project.status === "published" && (
                            <Link
                              to={`/gallery/${project.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View ${project.title} on the website (opens in a new tab)`}
                              className="btn-outline btn-sm"
                            >
                              <ExternalLink size={14} aria-hidden="true" />
                              View on website
                            </Link>
                          )}
                        </div>
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
              {filter === "all" ? "No projects yet." : `No ${filter} projects.`}
            </p>
            <p className="mt-2 text-obsidian/80">
              {filter === "all"
                ? "Add your first project to start building the portfolio."
                : "Projects with this status will appear here."}
            </p>
          </div>
        ))}
    </div>
  );
}
