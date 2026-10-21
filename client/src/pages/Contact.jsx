import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";
import SectionHeading from "../components/shared/SectionHeading";
import QuoteForm from "../components/contact/QuoteForm";
import usePageMeta from "../hooks/usePageMeta";
import { siteConfig, getPhoneLink, getWhatsAppLink } from "../data/siteConfig";

export default function Contact() {
  usePageMeta(
    "Contact and Quotations",
    "Request a personalised quote for marble or POP work from ELITE Marble & POP Works Ltd., or contact us directly."
  );

  const { contact } = siteConfig;
  const linkClass = "inline-flex min-h-11 items-center gap-3 underline-offset-4 hover:underline";

  return (
    <section className="container-page py-14 md:py-20">
      <SectionHeading
        as="h1"
        eyebrow="Contact"
        title="Request a personalised quote"
        description="Tell us about your project and we will get back to you. Prefer to talk? You can contact us directly using the details beside the form."
      />

      <div className="mt-14 grid gap-14 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
        <QuoteForm />

        {/* Direct contact options: the site works as a portfolio without the form */}
        <aside className="h-fit border-t-2 border-gold pt-6 lg:sticky lg:top-28">
          <h2 className="text-3xl font-medium">Contact us directly</h2>
          <ul className="mt-6 space-y-3 text-base">
            <li>
              <a href={getPhoneLink()} className={linkClass}>
                <Phone size={18} aria-hidden="true" />
                {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <MessageCircle size={18} aria-hidden="true" />
                Chat on WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className={linkClass}>
                <Mail size={18} aria-hidden="true" />
                {contact.email}
              </a>
            </li>
            <li className="flex gap-3 pt-2">
              <MapPin size={18} aria-hidden="true" className="mt-1 shrink-0" />
              <address className="not-italic">{contact.address}</address>
            </li>
          </ul>

          {/* Shown only while developing */}
          {import.meta.env.DEV && contact.isPlaceholder && (
            <p className="mt-6 text-xs text-obsidian/70">
              Dev note: these contact details are placeholders.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}