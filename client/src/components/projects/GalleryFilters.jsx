import { X } from "lucide-react";
import { services } from "../../data/services";

// A filter button. Dark when it is the active choice.
function chipClass(active) {
  return `inline-flex min-h-11 items-center border px-4 text-sm font-medium transition-colors ${
    active
      ? "border-obsidian bg-obsidian text-ivory"
      : "border-obsidian/30 hover:border-obsidian"
  }`;
}

// Service and category filters, plus a row showing the active filters.
// This component only DISPLAYS the filters. The Gallery page owns the actual values
// (they live in the URL), and this component reports clicks back through the props.
//
// Props:
//   service, category    current values ("" means "not filtered")
//   categories           the active categories, from the API
//   categoriesStatus     "loading", "ready" or "error"
//   onServiceChange(v)   v is "marble", "pop" or ""
//   onCategoryChange(v)  v is a category slug, or "" to clear it
//   onClear()            clears everything
export default function GalleryFilters({
  service,
  category,
  categories,
  categoriesStatus,
  onServiceChange,
  onCategoryChange,
  onClear,
}) {
  // With a service selected, show only that service's categories.
  const visibleServices = service
    ? services.filter((s) => s.slug === service)
    : services;
  const activeService = services.find((s) => s.slug === service);
  const activeCategory = categories.find((c) => c.slug === category);
  const hasFilters = Boolean(service || category);

  return (
    <div className="space-y-8">
      {/* ---------- Service ---------- */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-obsidian/70">
          Service
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!service}
            onClick={() => onServiceChange("")}
            className={chipClass(!service)}
          >
            All
          </button>
          {services.map((s) => (
            <button
              key={s.slug}
              type="button"
              aria-pressed={service === s.slug}
              onClick={() => onServiceChange(s.slug)}
              className={chipClass(service === s.slug)}
            >
              {s.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Category (grouped by service) ---------- */}
      {categoriesStatus === "loading" && (
        <p role="status" className="text-sm text-obsidian/75">
          Loading categories...
        </p>
      )}

      {categoriesStatus === "error" && (
        <p className="text-sm text-obsidian/75">
          Categories could not be loaded. You can still filter by service.
        </p>
      )}

      {categoriesStatus === "ready" && (
        <div className="space-y-5">
          {visibleServices.map((s) => {
            const group = categories.filter((c) => c.service === s.slug);
            if (group.length === 0) return null;

            return (
              <div key={s.slug}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-obsidian/70">
                  {s.shortName} categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={category === c.slug}
                      // Clicking the active category again turns it off
                      onClick={() =>
                        onCategoryChange(category === c.slug ? "" : c.slug)
                      }
                      className={chipClass(category === c.slug)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- Active filters ---------- */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-3 border-t border-obsidian/15 pt-6">
          <p className="text-sm font-semibold">Active filters:</p>
          <ul className="flex flex-wrap gap-2">
            {service && (
              <li>
                <button
                  type="button"
                  onClick={() => onServiceChange("")}
                  aria-label={`Remove filter: ${activeService?.shortName ?? service}`}
                  className="inline-flex min-h-11 items-center gap-2 border border-gold bg-gold/15 px-3 text-sm"
                >
                  {activeService?.shortName ?? service}
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            )}
            {category && (
              <li>
                <button
                  type="button"
                  onClick={() => onCategoryChange("")}
                  aria-label={`Remove filter: ${activeCategory?.name ?? category}`}
                  className="inline-flex min-h-11 items-center gap-2 border border-gold bg-gold/15 px-3 text-sm"
                >
                  {activeCategory?.name ?? category}
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            )}
          </ul>
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 border-b border-obsidian px-1 text-sm font-semibold"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
