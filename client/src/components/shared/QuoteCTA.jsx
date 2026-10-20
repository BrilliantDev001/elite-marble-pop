import { Link } from "react-router-dom";
import { Phone, Mail, MessageCircle } from "lucide-react";
import SectionHeading from "./SectionHeading";
import {
  siteConfig,
  getPhoneLink,
  getWhatsAppLink,
} from "../../data/siteConfig";

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
  const { contact } = siteConfig;
  const linkClass =
    "inline-flex items-center gap-2.5 text-ivory/90 transition-colors hover:text-gold";

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
            <a
              href={getWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-light"
            >
              WhatsApp us
            </a>
          </div>
        </div>

        <ul className="space-y-4 text-sm">
          <li>
            <a href={getPhoneLink()} className={linkClass}>
              <Phone size={18} aria-hidden="true" />
              {contact.phoneDisplay}
            </a>
          </li>
          <li>
            <a href={`mailto:${contact.email}`} className={linkClass}>
              <Mail size={18} aria-hidden="true" />
              {contact.email}
            </a>
          </li>
          <li>
            <a
              href={getWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <MessageCircle size={18} aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
