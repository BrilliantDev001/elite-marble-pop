import { Link } from "react-router-dom";
import SectionHeading from "../shared/SectionHeading";
import { siteConfig } from "../../data/siteConfig";

// Things that help us prepare a quotation. Same for both services.
const helpfulDetails = [
  "What you would like made, and the category it falls under",
  "Approximate sizes or measurements, if you have them",
  "The location where the work will be done",
  "Photos or reference images of the space or the style you like",
];

// Explains what affects cost in plain language. NO prices or price ranges are shown.
export default function PricingGuidance({ service }) {
  return (
    <section className="container-page py-20 md:py-28">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Pricing and quotations"
            title="Every project is priced individually."
            description={service.pricingIntro}
          />

          <p className="mt-6 text-obsidian/85">
            We do not publish fixed prices or price lists, because the right
            figure depends on your design, your materials and your site. Tell us
            about your project and we will prepare a personalised quotation.
          </p>

          <h3 className="mt-10 text-2xl font-medium">
            What helps us prepare your quote
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-obsidian/85">
            {helpfulDetails.map((detail) => (
              <li key={detail} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold"
                />
                {detail}
              </li>
            ))}
          </ul>

          <Link to="/contact" className="btn-primary mt-10">
            {siteConfig.quoteCtaLabel}
          </Link>
        </div>

        <div>
          <h3 className="text-2xl font-medium">What affects the cost</h3>
          <ul className="mt-6">
            {service.pricingFactors.map((factor) => (
              <li
                key={factor}
                className="flex gap-4 border-t border-obsidian/20 py-4 last:border-b"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-gold"
                />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
