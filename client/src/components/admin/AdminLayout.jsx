import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CircleAlert,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings,
  Star,
  Tags,
} from "lucide-react";
import BrandLogo from "../shared/BrandLogo";
import { projects as sampleProjects } from "../../data/projects";
import { categories as sampleCategories } from "../../data/categories";
import {
  initialAdminReviews,
  initialAdminEnquiries,
  initialAdminSettings,
} from "../../data/adminMock";

// The shell around every admin screen: banner, header, side navigation.
// All the mock data lives here as state. Screens read and change it with
//   const { reviews, setReviews } = useOutletContext();
export default function AdminLayout({ onLogout }) {
  const { pathname } = useLocation();

  const [projects, setProjects] = useState(sampleProjects);
  const [categories, setCategories] = useState(sampleCategories);
  const [reviews, setReviews] = useState(initialAdminReviews);
  const [enquiries, setEnquiries] = useState(initialAdminEnquiries);
  const [settings, setSettings] = useState(initialAdminSettings);

  // Scroll to the top when moving between admin screens.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const pendingReviews = reviews.filter(
    (review) => review.status === "pending",
  ).length;
  const newEnquiries = enquiries.filter(
    (enquiry) => enquiry.status === "New",
  ).length;

  const navItems = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/projects", label: "Projects", icon: Images },
    { to: "/admin/categories", label: "Categories", icon: Tags },
    {
      to: "/admin/reviews",
      label: "Reviews",
      icon: Star,
      count: pendingReviews,
      countLabel: "pending",
    },
    {
      to: "/admin/enquiries",
      label: "Enquiries",
      icon: Inbox,
      count: newEnquiries,
      countLabel: "new",
    },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-ivory">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-obsidian focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to main content
      </a>

      {/* Always-visible prototype warning */}
      <div className="bg-obsidian text-ivory">
        <div className="container-page flex items-start gap-3 py-2.5 text-sm">
          <CircleAlert
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-gold"
          />
          <p>
            <strong className="text-gold">PROTOTYPE.</strong> Mock data only.
            Nothing here is saved, there is no real login, and refreshing the
            page resets everything.
          </p>
        </div>
      </div>

      <header className="border-b border-obsidian/10">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo />
            <span className="hidden border-l border-obsidian/25 pl-4 text-sm font-semibold uppercase tracking-[0.2em] sm:inline">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="btn-outline btn-sm"
          >
            <LogOut size={14} aria-hidden="true" />
            Log out
          </button>
        </div>
      </header>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
        <nav aria-label="Admin">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 border px-4 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-obsidian bg-obsidian text-ivory"
                        : "border-obsidian/20 hover:border-obsidian"
                    }`
                  }
                >
                  <item.icon size={16} aria-hidden="true" />
                  {item.label}
                  {item.count > 0 && (
                    <span className="ml-auto bg-gold px-2 py-0.5 text-xs font-bold text-obsidian">
                      {item.count}
                      <span className="sr-only"> {item.countLabel}</span>
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main id="admin-main" className="min-w-0">
          <Outlet
            context={{
              projects,
              setProjects,
              categories,
              setCategories,
              reviews,
              setReviews,
              enquiries,
              setEnquiries,
              settings,
              setSettings,
            }}
          />
        </main>
      </div>
    </div>
  );
}
