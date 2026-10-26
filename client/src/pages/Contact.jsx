import SectionHeading from "../components/shared/SectionHeading";
import ContactLinks from "../components/shared/ContactLinks";
import QuoteForm from "../components/contact/QuoteForm";
import { useSettings } from "../context/settingsContext";
import usePageMeta from "../hooks/usePageMeta";
import { isPlaceholderContact } from "../data/siteConfig";

export default function Contact() {
  usePageMeta(
    "Contact and Quotations",
    "Request a personalised quote for marble or POP work from ELITE Marble & POP Works Ltd., or contact us directly.",
  );

  const { contact } = useSettings();

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
          <div className="mt-6">
            <ContactLinks
              iconSize={18}
              showAddress
              listClassName="space-y-3 text-base"
              linkClassName="min-h-11 underline-offset-4 hover:underline"
            />
          </div>

          {/* Shown only while developing, and only while the details are still the placeholders */}
          {import.meta.env.DEV && isPlaceholderContact(contact) && (
            <p className="mt-6 text-xs text-obsidian/70">
              Dev note: these contact details are still the placeholders.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
