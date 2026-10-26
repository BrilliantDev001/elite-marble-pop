import { Link } from "react-router-dom";
import { Images } from "lucide-react";
import SiteImage from "../shared/SiteImage";
import { getServiceBySlug } from "../../data/services";
 import { getProjectImages } from "../../utils/projects";

// One project in a grid: cover image, title, service and category.
// Clicking opens the project page at /gallery/:slug.
export default function ProjectCard({
  project,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
}) {
  const service = getServiceBySlug(project.service);
 
  const photoCount = getProjectImages(project).length;

  return (
    <article>
      <Link to={`/gallery/${project.slug}`} className="group block">
        <SiteImage
          image={project.coverImage}
          className="aspect-[4/3]"
          sizes={sizes}
        />

        <h3 className="mt-4 text-2xl font-medium">{project.title}</h3>

        <p className="mt-1 text-sm text-obsidian/80">
          {service?.shortName}
          {project.categoryName && ` · ${project.categoryName}`}
        </p>

        {/* Only shown when the project has more than one photo */}
        {photoCount > 1 && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-obsidian/70">
            <Images size={14} aria-hidden="true" />
            {photoCount} photos
          </p>
        )}
      </Link>
    </article>
  );
}
