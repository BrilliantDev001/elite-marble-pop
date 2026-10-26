import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CircleAlert,
  Images,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Settings,
  Star,
  Tags,
} from "lucide-react";
import BrandLogo from "../shared/BrandLogo";
import { useAdminSession } from "../../context/adminSessionContext";
import { apiRequest } from "../../services/api";

// The shell around every admin screen: header, side navigation and the real counts.
// Screens read the counts with:  const { counts, countsFailed, refreshCounts } = useOutletContext();
// and call refreshCounts() after they change something, so the side badges stay correct.
export default function AdminLayout() {
  const { pathname } = useLocation();
  const { admin, logout } = useAdminSession();

  const [counts, setCounts] = useState(null);
  const [countsFailed, setCountsFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Screens call refreshCounts() after they change something. It only asks for a reload.
  // The loading itself happens in the effect below.
  const [countsVersion, setCountsVersion] = useState(0);
  const refreshCounts = useCallback(() => setCountsVersion((version) => version + 1), []);

  // Each time a screen is opened: scroll to the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Loads the real counts (projects, reviews and enquiries by status) when a screen is opened,
  // and again whenever a screen asks for a refresh. A request that is no longer needed is cancelled.
  useEffect(() => {
    const controller = new AbortController();

    apiRequest("/api/admin/overview", { signal: controller.signal }).then(
      (data) => {
        setCounts(data);
        setCountsFailed(false);
      },
      (error) => {
        if (error.name !== "AbortError") setCountsFailed(true);
      }
    );

    return () => controller.abort();
  }, [pathname, countsVersion]);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout(); // on success, this whole screen is replaced by the login screen
    } catch (error) {
      setLoggingOut(false);
      setLogoutError(`${error.message} You are still logged in.`);
    }
  }

  const pendingReviews = counts?.reviews.pending ?? 0;
  const newEnquiries = counts?.enquiries.New ?? 0;

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

      <header className="border-b border-obsidian/10">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo />
            <span className="hidden border-l border-obsidian/25 pl-4 text-sm font-semibold uppercase tracking-[0.2em] sm:inline">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden max-w-[16rem] truncate text-sm text-obsidian/75 md:inline">
              {admin?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-busy={loggingOut}
              className="btn-outline btn-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loggingOut ? (
                <LoaderCircle
                  size={14}
                  aria-hidden="true"
                  className="animate-spin"
                />
              ) : (
                <LogOut size={14} aria-hidden="true" />
              )}
              Log out
            </button>
          </div>
        </div>
      </header>

      {logoutError && (
        <div role="alert" className="border-b border-red-800 bg-red-50">
          <div className="container-page flex items-start gap-3 py-3 text-sm">
            <CircleAlert
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-red-800"
            />
            <p>{logoutError}</p>
          </div>
        </div>
      )}

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
          <Outlet context={{ counts, countsFailed, refreshCounts }} />
        </main>
      </div>
    </div>
  );
}
