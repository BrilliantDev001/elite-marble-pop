import { Link } from "react-router-dom";
import SiteImage from "../shared/SiteImage";
import SectionHeading from "../shared/SectionHeading";
import QuoteCTA from "../shared/QuoteCTA";
import ProjectCard from "../projects/ProjectCard";
import CategoryPreview from "../home/CategoryPreview";
import PricingGuidance from "./PricingGuidance";
import usePageMeta from "../../hooks/usePageMeta";
import { getServiceBySlug } from "../../data/services";
import { filterProjects } from "../../data/projects";
import { getGalleryLink } from "../../data/categories";
import { siteConfig } from "../../data/siteConfig";

// One page layout used by both /marble and /pop.
//   serviceSlug: "marble" or "pop"
//   tone: "light" (image on the right) or "dark" (dark hero, image on the left)
export default function ServicePage({ serviceSlug, tone = "light" }) {
  const service = getServiceBySlug(serviceSlug);
  usePageMeta(service?.name, service?.intro);

  if (!service) return null;

  const isDark = tone === "dark";

  // Up to 4 published projects for this service, featured ones first.
  const all = filterProjects({ service: serviceSlug });
  const selected = [
    ...all.filter((project) => project.featured),
    ...all.filter((project) => !project.featured),
  ].slice(0, 4);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section
        className={
          isDark ? "bg-obsidian text-ivory" : "border-b border-obsidian/10"
        }
      >
        <div className="container-page grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-16">
          <div className={isDark ? "lg:order-2" : ""}>
            <p
              className={`mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] ${
                isDark ? "text-gold" : "text-obsidian/70"
              }`}
            >
              <span aria-hidden="true" className="h-px w-8 bg-gold" />
              {siteConfig.positioning}
            </p>

            <h1 className="text-5xl font-medium md:text-6xl">{service.name}</h1>
            <p className="mt-4 font-heading text-2xl italic md:text-3xl">
              {service.tagline}
            </p>
            <p
              className={`mt-5 max-w-xl ${isDark ? "text-ivory/85" : "text-obsidian/85"}`}
            >
              {service.intro}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to={getGalleryLink({ service: serviceSlug })}
                className="btn-primary"
              >
                View {service.shortName} Projects
              </Link>
                            <Link
                to={`/contact?service=${serviceSlug}`}
                className={isDark ? "btn-outline-light" : "btn-outline"}
              >
                Request a Quote
              </Link>
            </div>
          </div>

          <SiteImage
            image={service.heroImage}
            className={`aspect-4/3 ${isDark ? "lg:order-1" : ""}`}
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </section>

      {/* ---------- Categories (each links to the filtered gallery) ---------- */}
      <CategoryPreview
        service={serviceSlug}
        title={`${service.shortName} categories`}
        description="Choose a category to see related projects in the gallery. These categories are proposed and may change as the service list is confirmed."
      />

      {/* ---------- Selected projects ---------- */}
      <section className="`bg-obsidian/0.04` py-20 md:py-28">
        <div className="container-page">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Selected projects"
              title={`${service.shortName} work`}
            />
            <Link
              to={getGalleryLink({ service: serviceSlug })}
              className="btn-outline btn-sm self-start md:self-auto"
            >
              View all {service.shortName} projects
            </Link>
          </div>

          {selected.length > 0 ? (
            <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {selected.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <p className="mt-14 border border-obsidian/15 p-8 text-obsidian/80">
              {service.shortName} projects will appear here once they have been
              published.
            </p>
          )}
        </div>
      </section>

      {/* ---------- Pricing guidance (no prices) ---------- */}
      <PricingGuidance service={service} />

      {/* ---------- Closing call to action ---------- */} 
      <QuoteCTA
        title={`Planning ${service.shortName} work?`}
        whatsappMessage={`Hello ELITE, I would like a quote for ${service.name}.`}
      />
    </>
  );
}
