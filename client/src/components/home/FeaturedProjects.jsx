import { Link } from "react-router-dom";
import SectionHeading from "../shared/SectionHeading";
import ProjectCard from "../projects/ProjectCard";
import { getFeaturedProjects } from "../../data/projects";

// A small selection of featured, published projects for the home page.
export default function FeaturedProjects() {
  const featured = getFeaturedProjects(4);

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

      {featured.length > 0 ? (
        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        // Empty state: shown when no project has been marked as featured
        <p className="mt-14 border border-obsidian/15 p-8 text-obsidian/80">
          Featured projects will appear here once they have been selected.
        </p>
      )}
    </section>
  );
}
