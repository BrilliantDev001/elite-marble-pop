import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Page not found");

  return (
    <section className="container-page py-24">
      <h1 className="text-5xl font-medium">Page not found</h1>
      <p className="mt-4 text-obsidian/80">
        The page you are looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn-outline mt-8">
        Back to home
      </Link>
    </section>
  );
}
