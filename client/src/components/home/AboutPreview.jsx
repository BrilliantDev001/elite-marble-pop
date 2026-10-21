import SectionHeading from "../shared/SectionHeading";
import SiteImage from "../shared/SiteImage";
import { siteConfig } from "../../data/siteConfig";

// PLACEHOLDER COPY: describes the working philosophy only.
// The owner's name, story, experience and photo go here once the business supplies them.
export default function AboutPreview() {
  return (
    <section id="about" className="container-page scroll-mt-24 py-20 md:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <SiteImage
          image={siteConfig.aboutImage}
          className="aspect-4/5 lg:order-2"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />

        <div className="lg:order-1">
          <SectionHeading
            eyebrow="About the artisan"
            title="Made by hand, finished with patience."
          />
          <div className="mt-6 space-y-4 text-obsidian/85">
            <p>
              ELITE is built around careful work. We choose materials with
              attention, shape them with precision, and finish each surface
              properly, because the details are what people live with every day.
            </p>
            <p>
              Marble and POP are different crafts, but they share one standard:
              if it is part of your space, it should be done well.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
