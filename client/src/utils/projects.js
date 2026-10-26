// Small helpers shared by the project and gallery pages.

// Builds a shareable gallery link.
// getGalleryLink({ service: "marble", category: "kitchen-countertops" })
//   -> "/gallery?service=marble&category=kitchen-countertops"
// Leave a value out to skip it. With no values it returns "/gallery".
export function getGalleryLink({ service = "", category = "" } = {}) {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/gallery?${query}` : "/gallery";
}

// All photos of a project in one list, cover first. Used by the project page and the lightbox.
export function getProjectImages(project) {
  return [project.coverImage, ...project.images];
}
