import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SectionHeading from "../shared/SectionHeading";
import SiteImage from "../shared/SiteImage";
import { services } from "../../data/services";

// Introduces the two specialties and sends visitors to /marble or /pop.
export default function SpecialtySelector() {
  return (
    <section className="container-page py-20 md:py-28">
      <SectionHeading
        eyebrow="Two specialties, one standard"
        title="Marble and POP, finished with the same care."
        description="Choose a specialty to see the kinds of work we do and how a quotation is prepared."
      />

      <div className="mt-14 grid gap-14 md:grid-cols-2 md:gap-10">
        {services.map((service) => (
          <article key={service.id}>
            {/* The whole block is one link, so there is only one tab stop per specialty */}
            <Link to={`/${service.slug}`} className="group block">
              <SiteImage
                image={service.heroImage}
                className="aspect-[4/3]"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
              <h3 className="mt-6 text-3xl font-medium md:text-4xl">
                {service.name}
              </h3>
              <p className="mt-3 text-obsidian/80">{service.intro}</p>
              <span className="mt-5 inline-flex items-center gap-2 border-b-2 border-gold pb-1 text-sm font-semibold uppercase tracking-[0.12em]">
                Explore {service.name}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
