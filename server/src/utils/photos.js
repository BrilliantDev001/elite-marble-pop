import Project from "../models/Project.js";
import Category from "../models/Category.js";
import { fieldError } from "./httpError.js";
import { UPLOAD_FOLDERS, verifyUpload, deleteFile } from "./imagekit.js";

const PLACEHOLDER_PREFIX = "/placeholders/";

// A photo is "known" when it is already saved on the record being edited. Known photos are not
// checked with ImageKit again (so editing a caption is fast), but their address must not change.
// filesOf(photo, photo, ...) -> Map of fileId -> url, for the photos that have a fileId.
export function filesOf(...photos) {
  return new Map(
    photos
      .filter((photo) => photo?.fileId)
      .map((photo) => [photo.fileId, photo.url]),
  );
}

// Each ImageKit file may belong to only ONE project or category. Otherwise, removing it from one
// place would delete it from the other.
async function assertFileUnused(
  fileId,
  field,
  { exceptProjectId, exceptCategorySlug },
) {
  const projectFilter = {
    $or: [{ "coverImage.fileId": fileId }, { "images.fileId": fileId }],
  };
  if (exceptProjectId) projectFilter._id = { $ne: exceptProjectId };

  const categoryFilter = { "image.fileId": fileId };
  if (exceptCategorySlug) categoryFilter.slug = { $ne: exceptCategorySlug };

  const [inProject, inCategory] = await Promise.all([
    Project.exists(projectFilter),
    Category.exists(categoryFilter),
  ]);
  if (inProject || inCategory) {
    throw fieldError(
      409,
      `${field}.url`,
      "This photo is already used elsewhere. Please upload it again.",
    );
  }
}

// entries: [{ field: "coverImage" | "images.2" | "image", photo }, ...]
// Returns the photos in the same order, with ImageKit's own address on newly verified ones.
async function prepareEntries(
  entries,
  { folder, knownFiles, exceptProjectId, exceptCategorySlug },
) {
  // 1. Quick checks that need no network.
  const seen = new Set();
  for (const { field, photo } of entries) {
    if (photo.url.startsWith(PLACEHOLDER_PREFIX)) {
      if (photo.fileId)
        throw fieldError(
          400,
          `${field}.url`,
          "A placeholder photo cannot have a file ID.",
        );
      continue;
    }
    if (!photo.fileId) {
      throw fieldError(
        400,
        `${field}.url`,
        "This photo was not uploaded through the admin. Please upload it again.",
      );
    }
    if (seen.has(photo.fileId))
      throw fieldError(400, `${field}.url`, "The same photo was added twice.");
    seen.add(photo.fileId);

    const knownUrl = knownFiles.get(photo.fileId);
    if (knownUrl !== undefined && knownUrl !== photo.url) {
      throw fieldError(
        400,
        `${field}.url`,
        "This photo's address was changed. Please upload it again.",
      );
    }
  }

  // 2. New photos are checked with ImageKit (in parallel).
  return Promise.all(
    entries.map(async ({ field, photo }) => {
      if (!photo.fileId || knownFiles.has(photo.fileId)) return photo;

      await assertFileUnused(photo.fileId, field, {
        exceptProjectId,
        exceptCategorySlug,
      });
      const result = await verifyUpload({
        fileId: photo.fileId,
        url: photo.url,
        folder: UPLOAD_FOLDERS[folder],
      });
      if (result.error) throw fieldError(400, `${field}.url`, result.error);
      return { ...photo, url: result.url };
    }),
  );
}

// Checks a project's cover and/or extra photos. Send only the parts that are changing.
export async function prepareProjectPhotos(
  { coverImage, images },
  { knownFiles = new Map(), exceptProjectId } = {},
) {
  const entries = [];
  if (coverImage) entries.push({ field: "coverImage", photo: coverImage });
  (images ?? []).forEach((photo, index) =>
    entries.push({ field: `images.${index}`, photo }),
  );

  const prepared = await prepareEntries(entries, {
    folder: "project",
    knownFiles,
    exceptProjectId,
  });

  const result = {};
  if (coverImage) result.coverImage = prepared[0];
  if (images) result.images = prepared.slice(coverImage ? 1 : 0);
  return result;
}

// Checks a category's photo. null (no photo) is fine.
export async function prepareCategoryPhoto(
  image,
  { knownFiles = new Map(), exceptCategorySlug } = {},
) {
  if (!image) return null;
  const [prepared] = await prepareEntries([{ field: "image", photo: image }], {
    folder: "category",
    knownFiles,
    exceptCategorySlug,
  });
  return prepared;
}

// After saving: deletes from ImageKit any file that was on the record before but is not now.
// A failed delete never blocks the admin. It is logged instead, and the file can be removed later.
export async function deleteRemovedFiles(before, after) {
  for (const fileId of before.keys()) {
    if (after.has(fileId)) continue;
    try {
      await deleteFile(fileId);
    } catch (error) {
      console.error(
        `Could not delete ImageKit file ${fileId}: ${error.message}`,
      );
    }
  }
}
