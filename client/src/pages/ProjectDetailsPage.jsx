import { Link, useParams } from "react-router-dom";
import ProjectDetails from "../components/projects/ProjectDetails";
import ProjectCard from "../components/projects/ProjectCard";
import SectionHeading from "../components/shared/SectionHeading";
import QuoteCTA from "../components/shared/QuoteCTA";
import LoadError from "../components/shared/LoadError";
import useApi from "../hooks/useApi";
import usePageMeta from "../hooks/usePageMeta";
import { toProject } from "../services/mappers";
import { getServiceBySlug } from "../data/services";

export default function ProjectDetailsPage() {
  const { slug } = useParams(); // the part of the URL after /gallery/

  // The API only returns PUBLISHED projects. A draft or archived one gets the same "not found"
  // (404) as an address that does not exist.
  const { status, data, error, reload } = useApi(
    `/api/projects/${encodeURIComponent(slug)}`,
  );
  const project = data?.project ? toProject(data.project) : null;
  const service = project ? getServiceBySlug(project.service) : null;
  const notFound = status === "error" && error?.status === 404;

  // "More like this": up to 3 other projects from the same category. This waits for the project
  // first, and if it fails the page simply shows no extra row.
  const relatedRequest = useApi(project ? "/api/projects" : null, {
    category: project?.category,
    limit: 4,
  });
  const related = (relatedRequest.data?.items ?? [])
    .filter((other) => other.id !== project?.id)
    .slice(0, 3)
    .map(toProject);

  let title = "Project";
  if (project) title = project.title;
  else if (notFound) title = "Project not found";

  usePageMeta(
    title,
    project
      ? project.description ||
          `${project.title}: ${service?.name ?? ""} by ELITE.`
      : undefined,
  );

  // ---------- Loading ----------
  if (status === "loading") {
    return (
      <section className="container-page py-24" role="status">
        <p className="text-obsidian/80">Loading project...</p>
      </section>
    );
  }

  // ---------- Not found ----------
  if (notFound) {
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

  // ---------- Could not load ----------
  if (status === "error") {
    return (
      <section className="container-page py-24">
        <LoadError message="We could not load this project." onRetry={reload} />
      </section>
    );
  }

  return (
    <>
      <ProjectDetails project={project} />

      {related.length > 0 && (
        <section className="bg-obsidian/[0.04] py-20">
          <div className="container-page">
            <SectionHeading
              as="h2"
              eyebrow="Keep exploring"
              title={`More ${project.categoryName || "projects"}`}
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
