import { NavLink, Link } from "react-router-dom";
import { navLinks, siteConfig } from "../../data/siteConfig";

// The dropdown menu shown on phones and tablets.
// The Header controls when it opens, closes and handles the Escape key.
// When it is closed we render nothing, so its links can't be tabbed to by accident.
export default function MobileMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <nav
      id="mobile-menu"
      aria-label="Mobile"
      className="absolute inset-x-0 top-full border-t border-ivory/10 bg-obsidian lg:hidden"
    >
      <ul className="container-page py-4">
        {navLinks.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `block border-b border-ivory/10 py-3.5 font-heading text-2xl ${
                  isActive ? "text-gold" : "text-ivory"
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="container-page pb-6">
        <Link to="/contact" onClick={onClose} className="btn-primary w-full">
          {siteConfig.quoteCtaLabel}
        </Link>
      </div>
    </nav>
  );
}
