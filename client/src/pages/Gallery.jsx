import { useSearchParams } from "react-router-dom";
import SectionHeading from "../components/shared/SectionHeading";
import QuoteCTA from "../components/shared/QuoteCTA";
import GalleryFilters from "../components/projects/GalleryFilters";
import ProjectGallery from "../components/projects/ProjectGallery";
import useApi from "../hooks/useApi";
import usePagedApi from "../hooks/usePagedApi";
import usePageMeta from "../hooks/usePageMeta";
import { toProject } from "../services/mappers";
import { getServiceBySlug } from "../data/services";

const PAGE_SIZE = 9; // three rows of three on desktop

export default function Gallery() {
  // The filters live in the URL: /gallery?service=marble&category=kitchen-countertops
  const [searchParams, setSearchParams] = useSearchParams();

  // The active categories, for the filter buttons.
  const categoriesRequest = useApi("/api/categories");
  const categories = categoriesRequest.data?.items ?? [];
  const categoriesStatus = categoriesRequest.status;

  // Unknown values in the URL (a typo, an old link, an archived category) are ignored.
  // While the categories are still loading, a category in the URL is trusted for now.
  const rawService = searchParams.get("service") ?? "";
  const rawCategory = searchParams.get("category") ?? "";
  const service = getServiceBySlug(rawService) ? rawService : "";
  const knownCategory = categories.find((c) => c.slug === rawCategory);
  const category =
    rawCategory && (categoriesStatus !== "ready" || knownCategory)
      ? rawCategory
      : "";

  // Page title reflects the filter, e.g. "Kitchen Countertops Gallery"
  const categoryName = knownCategory?.name;
  const serviceName = getServiceBySlug(service)?.shortName;
  usePageMeta(
    categoryName
      ? `${categoryName} Gallery`
      : serviceName
        ? `${serviceName} Gallery`
        : "Gallery",
    "Browse marble and POP projects by ELITE. Filter by service and category.",
  );

  // The projects, loaded from the API one page at a time (the server does the filtering).
  const list = usePagedApi("/api/projects", { service, category }, PAGE_SIZE);
  const projects = list.items.map(toProject);

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
      category && (!value || knownCategory?.service === value);
    updateFilters(value, keepCategory ? category : "");
  }

  function handleCategoryChange(value) {
    // Choosing a category also selects the service it belongs to
    const owningService = value
      ? (categories.find((c) => c.slug === value)?.service ?? service)
      : service;
    updateFilters(owningService, value);
  }

  function handleClear() {
    updateFilters("", "");
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
            categories={categories}
            categoriesStatus={categoriesStatus}
            onServiceChange={handleServiceChange}
            onCategoryChange={handleCategoryChange}
            onClear={handleClear}
          />
        </div>

        <div className="mt-14">
          <ProjectGallery
            projects={projects}
            status={list.status}
            total={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
            moreError={list.moreError}
            hasFilters={Boolean(service || category)}
            onLoadMore={list.loadMore}
            onClear={handleClear}
            onRetry={list.reload}
          />
        </div>
      </section>

      <QuoteCTA />
    </>
  );
}
