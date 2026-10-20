import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

// Wraps every public page with the header and footer.
// <Outlet /> is where the current page is displayed.
export default function MainLayout() {
  const { pathname, hash } = useLocation();

  // On a new page, scroll back to the top. If the link has a #hash
  // (like /#about), scroll to that section instead.
  // Changing only the filters (?service=...) does not change pathname, so it won't jump.
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Lets keyboard users skip the navigation. Visible only when focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-obsidian focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
