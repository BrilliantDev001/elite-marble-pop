import { Link } from "react-router-dom";
import SectionHeading from "../shared/SectionHeading";
import CardGridSkeleton from "../shared/CardGridSkeleton";
import LoadError from "../shared/LoadError";
import ProjectCard from "../projects/ProjectCard";
import useApi from "../../hooks/useApi";
import { toProject } from "../../services/mappers";

const GRID = "mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4";

// A small selection of featured, published projects for the home page (from the API).
export default function FeaturedProjects() {
  const { status, data, reload } = useApi("/api/projects", {
    featured: "true",
    limit: 4,
  });
  const featured = (data?.items ?? []).map(toProject);

  return (
    <section className="container-page py-20 md:py-28">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Selected projects"
          title="A closer look at the work."
          description="A small selection from the portfolio. Open the gallery to see more."
        />
        <Link
          to="/gallery"
          className="btn-outline btn-sm self-start md:self-auto"
        >
          View full gallery
        </Link>
      </div>

      {status === "loading" && <CardGridSkeleton count={4} className={GRID} />}

      {status === "error" && (
        <div className="mt-14">
          <LoadError
            message="We could not load the featured projects."
            onRetry={reload}
          />
        </div>
      )}

      {status === "ready" &&
        (featured.length > 0 ? (
          <div className={GRID}>
            {featured.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          // Empty state: shown when no project has been marked as featured
          <p className="mt-14 border border-obsidian/15 p-8 text-obsidian/80">
            Featured projects will appear here once they have been selected.
          </p>
        ))}
    </section>
  );
}
