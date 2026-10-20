import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import BrandLogo from "../shared/BrandLogo";
import MobileMenu from "./MobileMenu";
import { navLinks } from "../../data/siteConfig";

export default function Header() {
  const { pathname } = useLocation();
  const buttonRef = useRef(null);

  // We store WHICH page the menu was opened on. The menu counts as open only
  // while we are still on that page, so it closes by itself after navigating.
  const [openPath, setOpenPath] = useState(null);
  const menuOpen = openPath === pathname;

  function toggleMenu() {
    setOpenPath(menuOpen ? null : pathname);
  }

  function closeMenu() {
    setOpenPath(null);
  }

  // Escape closes the menu and returns focus to the menu button.
  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenPath(null);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-obsidian/10 bg-ivory">
      <div className="container-page flex h-20 items-center justify-between gap-6">
        <BrandLogo />

        {/* Desktop navigation (hidden below 1024px) */}
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `border-b-2 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-gold text-obsidian"
                    : "border-transparent text-obsidian/75 hover:text-obsidian"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/contact"
            className="btn-primary btn-sm hidden sm:inline-flex"
          >
            Request a Quote
          </Link>

          {/* Menu button (hidden from 1024px up) */}
          <button
            ref={buttonRef}
            type="button"
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 items-center justify-center border border-obsidian/20 lg:hidden"
          >
            {menuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <MobileMenu isOpen={menuOpen} onClose={closeMenu} />
    </header>
  );
}
