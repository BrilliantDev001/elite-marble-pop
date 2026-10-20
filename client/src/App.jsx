import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Marble from "./pages/Marble";
import POP from "./pages/POP";
import Gallery from "./pages/Gallery";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import Reviews from "./pages/Reviews";
import WriteReview from "./pages/WriteReview";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// The admin area is loaded only when someone visits /admin,
// so its code is not downloaded by normal visitors.
const Admin = lazy(() => import("./pages/Admin"));

export default function App() {
  return (
    <Routes>
      {/* Public pages share the header and footer from MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marble" element={<Marble />} />
        <Route path="/pop" element={<POP />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/:slug" element={<ProjectDetailsPage />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reviews/write" element={<WriteReview />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin sits outside MainLayout: it will get its own layout later */}
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<p className="p-8">Loading admin...</p>}>
            <Admin />
          </Suspense>
        }
      />
    </Routes>
  );
}
