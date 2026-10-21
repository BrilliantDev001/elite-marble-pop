import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { Plus, Star } from "lucide-react";
import SiteImage from "../shared/SiteImage";
import usePageMeta from "../../hooks/usePageMeta";
import { getServiceBySlug } from "../../data/services";
import { getProjectImages } from "../../data/projects";
import { formatDate, todayISO } from "../../data/adminMock";

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
  const { projects, setProjects, categories } = useOutletContext();

  // After saving in the form, we arrive here with a message to show.
  const initialMessage = location.state?.message ?? "";

  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState(initialMessage);
  const messageRef = useRef(null);

  useEffect(() => {
    if (initialMessage) messageRef.current?.focus();
  }, [initialMessage]);

  const countFor = (value) =>
    value === "all"
      ? projects.length
      : projects.filter((project) => project.status === value).length;

  const shown = projects
    .filter((project) => filter === "all" || project.status === filter)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  // Applies a change to one project and announces what happened.
  // If the project leaves the current tab, focus moves to the message
  // so keyboard users do not lose their place.
  function updateProject(project, changes, text) {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? { ...item, ...changes, updatedAt: todayISO() }
          : item,
      ),
    );
    setMessage(text);

    const newStatus = changes.status ?? project.status;
    if (filter !== "all" && newStatus !== filter) messageRef.current?.focus();
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

      <p className="mt-3 max-w-2xl text-sm text-obsidian/70">
        Prototype note: changes here do not alter the public pages of this demo
        site.
      </p>

      {/* Status tabs */}
      <div
        className="mt-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter projects by status"
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

      <p
        ref={messageRef}
        role="status"
        tabIndex={-1}
        className={`mt-6 border-l-2 border-gold pl-4 text-sm focus:outline-none ${
          message ? "" : "sr-only"
        }`}
      >
        {message}
      </p>

      {shown.length > 0 ? (
        <ul className="mt-8 space-y-5">
          {shown.map((project) => {
            const service = getServiceBySlug(project.service);
            const category = categories.find(
              (item) => item.slug === project.category,
            );
            const photoCount = getProjectImages(project).length;

            return (
              <li key={project.id}>
                <article className="flex flex-col gap-5 border border-obsidian/25 p-5 sm:flex-row">
                  <SiteImage
                    image={project.coverImage}
                    className="h-40 w-full shrink-0 sm:h-28 sm:w-40"
                    sizes="160px"
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-medium">{project.title}</h2>

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
                      {category?.name ?? project.category} · {photoCount}{" "}
                      {photoCount === 1 ? "photo" : "photos"} · Updated{" "}
                      {formatDate(project.updatedAt)}
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
                          aria-label={`Publish ${project.title}`}
                          onClick={() =>
                            updateProject(
                              project,
                              { status: "published" },
                              `Published "${project.title}".`,
                            )
                          }
                          className="btn-primary btn-sm"
                        >
                          Publish
                        </button>
                      )}

                      {project.status === "published" && (
                        <button
                          type="button"
                          aria-label={`Unpublish ${project.title}`}
                          onClick={() =>
                            updateProject(
                              project,
                              { status: "draft" },
                              `Unpublished "${project.title}". It is now a draft and hidden from the public.`,
                            )
                          }
                          className="btn-outline btn-sm"
                        >
                          Unpublish
                        </button>
                      )}

                      {project.status === "archived" && (
                        <button
                          type="button"
                          aria-label={`Restore ${project.title} as a draft`}
                          onClick={() =>
                            updateProject(
                              project,
                              { status: "draft" },
                              `Restored "${project.title}" as a draft.`,
                            )
                          }
                          className="btn-outline btn-sm"
                        >
                          Restore as draft
                        </button>
                      )}

                      {project.status !== "archived" && (
                        <>
                          <button
                            type="button"
                            aria-label={`${project.featured ? "Remove from featured" : "Feature"}: ${project.title}`}
                            onClick={() =>
                              updateProject(
                                project,
                                { featured: !project.featured },
                                project.featured
                                  ? `"${project.title}" is no longer featured.`
                                  : `"${project.title}" is now featured. It appears on the home page once published.`,
                              )
                            }
                            className="btn-outline btn-sm"
                          >
                            <Star size={14} aria-hidden="true" />
                            {project.featured ? "Unfeature" : "Feature"}
                          </button>

                          <button
                            type="button"
                            aria-label={`Archive ${project.title}`}
                            onClick={() =>
                              updateProject(
                                project,
                                { status: "archived" },
                                `Archived "${project.title}". It is hidden from the public but not deleted. You can restore it any time.`,
                              )
                            }
                            className="btn-outline btn-sm"
                          >
                            Archive
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
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
      )}
    </div>
  );
}
