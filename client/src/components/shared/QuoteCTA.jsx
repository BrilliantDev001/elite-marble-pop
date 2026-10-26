import { Link } from "react-router-dom";
import SectionHeading from "./SectionHeading";
import ContactLinks from "./ContactLinks";
import { useSettings } from "../../context/settingsContext";
import { siteConfig, getWhatsAppLink } from "../../data/siteConfig";

// Closing "request a quote" band with direct contact options.
//
// Props:
//   title, description   optional heading text
//   whatsappMessage      optional prefilled WhatsApp text, e.g. mentioning a service
export default function QuoteCTA({
  title = "Planning a project? Let's talk.",
  description = "Tell us what you have in mind and we will prepare a personalised quotation. You can also reach us directly.",
  whatsappMessage,
}) {
  const { contact } = useSettings();

  return (
    <section className="bg-obsidian py-20 text-ivory md:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <SectionHeading
            eyebrow="Get in touch"
            title={title}
            description={description}
            tone="light"
          />
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link to="/contact" className="btn-primary">
              {siteConfig.quoteCtaLabel}
            </Link>
            {/* Only offered once the real WhatsApp number is known */}
            {contact && (
              <a
                href={getWhatsAppLink(whatsappMessage, contact)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-light"
              >
                WhatsApp us
              </a>
            )}
          </div>
        </div>

        <ContactLinks
          iconSize={18}
          linkClassName="text-ivory/90 transition-colors hover:text-gold"
          whatsappMessage={whatsappMessage}
        />
      </div>
    </section>
  );
}
