// Turns the API's photo shape into the shape the components already use.
export function toImage(apiImage) {
  return {
    src: apiImage.url,
    alt: apiImage.alt,
    caption: apiImage.caption ?? "",
    // Local placeholder photos are marked so the dev-only "Placeholder" badge keeps working.
    isPlaceholder: apiImage.url.startsWith("/placeholders/"),
  };
}

export function toProject(apiProject) {
  return {
    ...apiProject,
    coverImage: toImage(apiProject.coverImage),
    images: apiProject.images.map(toImage),
  };
}

export function toCategory(apiCategory) {
  return {
    ...apiCategory,
    image: apiCategory.image ? toImage(apiCategory.image) : null,
  };
}
