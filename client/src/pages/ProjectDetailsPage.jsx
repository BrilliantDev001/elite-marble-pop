import { Link, useParams } from "react-router-dom";
import ProjectDetails from "../components/projects/ProjectDetails";
import ProjectCard from "../components/projects/ProjectCard";
import SectionHeading from "../components/shared/SectionHeading";
import QuoteCTA from "../components/shared/QuoteCTA";
import usePageMeta from "../hooks/usePageMeta";
import { filterProjects, getProjectBySlug } from "../data/projects";
import { getCategoryBySlug } from "../data/categories";
import { getServiceBySlug } from "../data/services";

export default function ProjectDetailsPage() {
  const { slug } = useParams(); // the part of the URL after /gallery/

  // getProjectBySlug only finds PUBLISHED projects, so drafts give "not found".
  const project = getProjectBySlug(slug);
  const category = project ? getCategoryBySlug(project.category) : null;
  const service = project ? getServiceBySlug(project.service) : null;

  usePageMeta(
    project ? project.title : "Project not found",
    project
      ? project.description ||
          `${project.title}: ${service?.name ?? ""} by ELITE.`
      : undefined,
  );

  // ---------- Not found ----------
  if (!project) {
    return (
      <section className="container-page py-24">
        <h1 className="text-5xl font-medium">Project not found</h1>
        <p className="mt-4 text-obsidian/80">
          This project does not exist or is no longer published.
        </p>
        <Link to="/gallery" className="btn-outline mt-8">
          Back to the gallery
        </Link>
      </section>
    );
  }

  // Up to 3 other published projects from the same category
  const related = filterProjects({ category: project.category })
    .filter((other) => other.id !== project.id)
    .slice(0, 3);

  return (
    <>
      <ProjectDetails project={project} />

      {related.length > 0 && (
        <section className="bg-obsidian/[0.04] py-20">
          <div className="container-page">
            <SectionHeading
              as="h2"
              eyebrow="Keep exploring"
              title={`More ${category?.name ?? "projects"}`}
            />
            <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <ProjectCard key={other.id} project={other} />
              ))}
            </div>
          </div>
        </section>
      )}

      <QuoteCTA
        whatsappMessage={`Hello ELITE, I saw "${project.title}" on your website and would like a quote.`}
      />
    </>
  );
}
