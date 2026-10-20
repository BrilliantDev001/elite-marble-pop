import { useSearchParams } from "react-router-dom";
import SectionHeading from "../components/shared/SectionHeading";
import QuoteCTA from "../components/shared/QuoteCTA";
import GalleryFilters from "../components/projects/GalleryFilters";
import ProjectGallery from "../components/projects/ProjectGallery";
import usePageMeta from "../hooks/usePageMeta";
import { filterProjects } from "../data/projects";
import { getCategoryBySlug } from "../data/categories";
import { getServiceBySlug } from "../data/services";

export default function Gallery() {
  // The filters live in the URL: /gallery?service=marble&category=kitchen-countertops
  const [searchParams, setSearchParams] = useSearchParams();

  // Unknown values in the URL (a typo, an old link) are ignored.
  const rawService = searchParams.get("service") ?? "";
  const rawCategory = searchParams.get("category") ?? "";
  const service = getServiceBySlug(rawService) ? rawService : "";
  const category = getCategoryBySlug(rawCategory) ? rawCategory : "";

  // Page title reflects the filter, e.g. "Kitchen Countertops Gallery"
  const categoryName = getCategoryBySlug(category)?.name;
  const serviceName = getServiceBySlug(service)?.shortName;
  usePageMeta(
    categoryName
      ? `${categoryName} Gallery`
      : serviceName
        ? `${serviceName} Gallery`
        : "Gallery",
    "Browse marble and POP projects by ELITE. Filter by service and category.",
  );

  // Dev only: add ?state=loading or ?state=error to the URL to preview those states.
  const demoState = import.meta.env.DEV ? searchParams.get("state") : null;
  const status =
    demoState === "loading" || demoState === "error" ? demoState : "ready";

  const projects = filterProjects({ service, category });

  // Writes new filter values into the URL, keeping any other parameters.
  function updateFilters(nextService, nextCategory) {
    const next = new URLSearchParams(searchParams);
    if (nextService) next.set("service", nextService);
    else next.delete("service");
    if (nextCategory) next.set("category", nextCategory);
    else next.delete("category");
    setSearchParams(next);
  }

  function handleServiceChange(value) {
    // Keep the chosen category only if it belongs to the new service
    const keepCategory =
      category && (!value || getCategoryBySlug(category).service === value);
    updateFilters(value, keepCategory ? category : "");
  }

  function handleCategoryChange(value) {
    // Choosing a category also selects the service it belongs to
    const owningService = value ? getCategoryBySlug(value).service : service;
    updateFilters(owningService, value);
  }

  function handleClear() {
    updateFilters("", "");
  }

  function handleRetry() {
    const next = new URLSearchParams(searchParams);
    next.delete("state");
    setSearchParams(next);
  }

  return (
    <>
      <section className="container-page py-14 md:py-20">
        <SectionHeading
          as="h1"
          eyebrow="Portfolio"
          title="Gallery"
          description="Browse our published projects across marble and POP. Use the filters to narrow the results."
        />

        <div className="mt-12">
          <GalleryFilters
            service={service}
            category={category}
            onServiceChange={handleServiceChange}
            onCategoryChange={handleCategoryChange}
            onClear={handleClear}
          />
        </div>

        <div className="mt-14">
          <ProjectGallery
            key={`${service}|${category}`}
            projects={projects}
            status={status}
            hasFilters={Boolean(service || category)}
            onClear={handleClear}
            onRetry={handleRetry}
          />
        </div>
      </section>

      <QuoteCTA />
    </>
  );
}
