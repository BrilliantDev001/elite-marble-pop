import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionHeading from "../shared/SectionHeading";
import SiteImage from "../shared/SiteImage";
import CardGridSkeleton from "../shared/CardGridSkeleton";
import LoadError from "../shared/LoadError";
import useApi from "../../hooks/useApi";
import { getServiceBySlug } from "../../data/services";
import { getGalleryLink } from "../../utils/projects";
import { toCategory } from "../../services/mappers";

// A row of category previews for one service. Each links to the gallery,
// already filtered to that category. The categories come from the API.
//
// Usage: <CategoryPreview service="marble" />
//        <CategoryPreview service="pop" tone="dark" />
export default function CategoryPreview({ service: serviceSlug, tone = "light", title, description }) {
  const service = getServiceBySlug(serviceSlug);
  const { status, data, reload } = useApi("/api/categories", { service: serviceSlug });
  const isDark = tone === "dark";

  if (!service) return null;

  const categories = (data?.items ?? []).map(toCategory);

  // Loaded, but there is nothing to show: hide the whole section instead of an empty heading.
  if (status === "ready" && categories.length === 0) return null;

  // 4 categories fit one row on desktop; 5 or more flow into 3 columns.
  const desktopColumns = categories.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

  return (
    <section
      id={`${serviceSlug}-categories`}
      className={`py-20 md:py-28 ${isDark ? "bg-obsidian text-ivory" : ""}`}
    >
      <div className="container-page">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={service.name}
            title={title ?? service.tagline}
            description={description ?? service.intro}
            tone={isDark ? "light" : "dark"}
          />
          <Link
            to={getGalleryLink({ service: serviceSlug })}
            className={`${isDark ? "btn-outline-light" : "btn-outline"} btn-sm self-start md:self-auto`}
          >
            View all {service.shortName} projects
          </Link>
        </div>

        {status === "loading" && (
          <CardGridSkeleton
            count={4}
            tone={isDark ? "dark" : "light"}
            className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
          />
        )}

        {status === "error" && (
          <div className="mt-14">
            <LoadError
              message="We could not load the categories."
              tone={isDark ? "dark" : "light"}
              onRetry={reload}
            />
          </div>
        )}

        {status === "ready" && (
          <div className={`mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 ${desktopColumns}`}>
            {categories.map((category) => (
              <article key={category.slug}>
                <Link
                  to={getGalleryLink({ service: serviceSlug, category: category.slug })}
                  className="group block"
                >
                  <SiteImage
                    image={category.image}
                    className="aspect-[4/3]"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <h3 className="mt-5 text-2xl font-medium">{category.name}</h3>
                  <p className={`mt-2 text-sm ${isDark ? "text-ivory/80" : "text-obsidian/80"}`}>
                    {category.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 border-b border-gold pb-0.5 text-xs font-semibold uppercase tracking-[0.12em]">
                    View Designs
                    <ArrowRight
                      size={14}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}