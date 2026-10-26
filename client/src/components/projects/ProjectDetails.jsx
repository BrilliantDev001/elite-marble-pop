import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import SiteImage from "../shared/SiteImage";
import ProjectLightbox from "./ProjectLightbox";
import { getGalleryLink, getProjectImages } from "../../utils/projects";
import { getServiceBySlug } from "../../data/services";

// The content of one project page: title, text, and a grid of its photos.
// Clicking a photo opens the lightbox on that photo.
export default function ProjectDetails({ project }) {
  // null = viewer closed, otherwise the number of the photo it should open on
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const service = getServiceBySlug(project.service);
  const categoryName = project.categoryName;
  const images = getProjectImages(project);

  return (
    <>
      <section className="container-page py-12 md:py-16">
        <Link
          to={getGalleryLink({
            service: project.service,
            category: project.category,
          })}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to {categoryName || "gallery"}
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-obsidian/70">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
            {service?.name}
            {categoryName && ` · ${categoryName}`}
          </p>

          <h1 className="text-4xl font-medium md:text-6xl">{project.title}</h1>

          {/* Always visible on sample projects, so they cannot pass as real work */}
          {project.isSample && (
            <p className="mt-5 inline-block bg-obsidian px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-ivory">
              Sample project, not real ELITE work
            </p>
          )}

          {project.description && (
            <p className="mt-6 text-lg text-obsidian/85">
              {project.description}
            </p>
          )}
          {project.details && (
            <p className="mt-4 text-obsidian/80">{project.details}</p>
          )}

          {/* Location is optional and only shown when the owner has approved it */}
          {project.location && (
            <p className="mt-5 inline-flex items-center gap-2 text-sm">
              <MapPin size={16} aria-hidden="true" />
              {project.location}
            </p>
          )}
        </div>

        {/* Photo grid: the first photo (the cover) is shown larger */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={`${image.src}-${index}`}
              className={index === 0 ? "sm:col-span-2 lg:col-span-3" : ""}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group block w-full text-left"
              >
                <SiteImage
                  image={image}
                  className={index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes={
                    index === 0
                      ? "100vw"
                      : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  }
                />
                <span className="sr-only">Open larger view</span>
              </button>
              {image.caption && (
                <p className="mt-2 text-sm text-obsidian/80">{image.caption}</p>
              )}
            </li>
          ))}
        </ul>

        {images.length > 1 && (
          <p className="mt-4 text-sm text-obsidian/70">
            Select a photo to view it larger.
          </p>
        )}
      </section>

      {/* The viewer exists only while a photo has been selected */}
      {lightboxIndex !== null && (
        <ProjectLightbox
          images={images}
          startIndex={lightboxIndex}
          title={project.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
