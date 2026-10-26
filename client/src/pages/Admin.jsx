import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import AdminSessionProvider from "../context/AdminSessionProvider";
import { useAdminSession } from "../context/adminSessionContext";
import AdminLogin from "../components/admin/AdminLogin";
import AdminLayout from "../components/admin/AdminLayout";
import AdminOverview from "../components/admin/AdminOverview";
import AdminReviews from "../components/admin/AdminReviews";
import AdminEnquiries from "../components/admin/AdminEnquiries";
import usePageMeta from "../hooks/usePageMeta";

// TEMPORARY: each screen is replaced by the real one in the next steps.
function AdminSectionStub({ title }) {
  usePageMeta(`Admin: ${title}`);
  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">{title}</h1>
      <p className="mt-3 text-obsidian/80">
        This screen is being connected to the real data in the next steps.
      </p>
    </div>
  );
}

// Decides what to show: a checking message, the login screen, or the dashboard.
function AdminGate() {
  const { status, error, retry } = useAdminSession();
  usePageMeta("Admin");

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory px-4">
        <p role="status" className="text-obsidian/80">
          Checking your login...
        </p>
      </main>
    );
  }

  // The server could not be reached, which is different from "not logged in".
  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory px-4 py-12">
        <div role="alert" className="max-w-md border border-obsidian/25 p-8">
          <p className="font-heading text-2xl">
            We could not check your login.
          </p>
          <p className="mt-2 text-obsidian/80">{error?.message}</p>
          <button type="button" onClick={retry} className="btn-outline mt-6">
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (status === "loggedOut") return <AdminLogin />;

  // These routes are relative to /admin (App.jsx mounts this page at /admin/*).
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route
          path="projects/*"
          element={<AdminSectionStub title="Projects" />}
        />
        <Route
          path="categories"
          element={<AdminSectionStub title="Categories" />}
        />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="enquiries" element={<AdminEnquiries />} />
        <Route
          path="settings"
          element={<AdminSectionStub title="Settings" />}
        />
        <Route path="*" element={<AdminSectionStub title="Page not found" />} />
      </Route>
    </Routes>
  );
}

// Must be a default export because App.jsx loads it with lazy().
export default function Admin() {
  // Ask search engines not to list the admin area.
  // (This is NOT security. The real protection is the login on the server.)
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  return (
    <AdminSessionProvider>
      <AdminGate />
    </AdminSessionProvider>
  );
}
