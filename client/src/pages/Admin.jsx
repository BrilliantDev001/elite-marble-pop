import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import AdminLogin from "../components/admin/AdminLogin";
import AdminLayout from "../components/admin/AdminLayout";
import AdminOverview from "../components/admin/AdminOverview";
import usePageMeta from "../hooks/usePageMeta";

// TEMPORARY: replaced screen by screen in the next two steps.
function AdminSectionStub({ title }) {
  usePageMeta(`Admin: ${title}`);
  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">{title}</h1>
      <p className="mt-3 text-obsidian/80">
        This screen is coming in the next step.
      </p>
    </div>
  );
}

// Must be a default export because App.jsx loads it with lazy().
export default function Admin() {
  // FAKE login state. It lives only in memory, so a refresh returns to the login screen.
  const [loggedIn, setLoggedIn] = useState(false);

  // Ask search engines not to list the admin area.
  // (This is NOT security. Real protection comes from the backend login.)
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  // These routes are relative to /admin (App.jsx mounts this page at /admin/*).
  return (
    <Routes>
      <Route element={<AdminLayout onLogout={() => setLoggedIn(false)} />}>
        <Route index element={<AdminOverview />} />
        <Route
          path="projects"
          element={<AdminSectionStub title="Projects" />}
        />
        <Route
          path="categories"
          element={<AdminSectionStub title="Categories" />}
        />
        <Route path="reviews" element={<AdminSectionStub title="Reviews" />} />
        <Route
          path="enquiries"
          element={<AdminSectionStub title="Enquiries" />}
        />
        <Route
          path="settings"
          element={<AdminSectionStub title="Settings" />}
        />
        <Route path="*" element={<AdminSectionStub title="Page not found" />} />
      </Route>
    </Routes>
  );
}
