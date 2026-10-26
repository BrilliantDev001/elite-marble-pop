import { Link } from "react-router-dom";
import BrandLogo from "../shared/BrandLogo";
import ContactLinks from "../shared/ContactLinks";
import { useSettings } from "../../context/settingsContext";
import { isPlaceholderContact, siteConfig } from "../../data/siteConfig";

const linkClass = "text-ivory/80 transition-colors hover:text-gold";

export default function Footer() {
  const { contact } = useSettings();

  return (
    <footer className="bg-obsidian text-ivory">
      <div className="container-page grid gap-12 py-16 md:grid-cols-3">
        <div>
          <BrandLogo tone="light" />
          <p className="mt-6 max-w-xs text-sm text-ivory/80">
            Premium marble installations and bespoke POP designs.
          </p>
        </div>

        <div>
          <h2 className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Explore
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <Link to="/marble" className={linkClass}>
                Marble Works
              </Link>
            </li>
            <li>
              <Link to="/pop" className={linkClass}>
                POP Works
              </Link>
            </li>
            <li>
              <Link to="/gallery" className={linkClass}>
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/reviews" className={linkClass}>
                Reviews
              </Link>
            </li>
            <li>
              <Link to="/#about" className={linkClass}>
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className={linkClass}>
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Get in touch
          </h2>
          <div className="mt-5">
            <ContactLinks linkClassName={`${linkClass} min-h-8`} />
          </div>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ivory/70 sm:flex-row sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}{" "}
            {siteConfig.descriptor}
          </p>
          {/* Shown only while developing, and only while the details are still the placeholders */}
          {import.meta.env.DEV && isPlaceholderContact(contact) && (
            <p>Dev note: contact details are still the placeholders.</p>
          )}
        </div>
      </div>
    </footer>
  );
}
