import { z } from "zod";
import {
  SERVICES,
  PROJECT_STATUSES,
  SLUG_PATTERN,
  MAX_PROJECT_IMAGES,
} from "../models/shared.js";
import { blankIfMissing, cleanText } from "./common.js";
import { isAllowedImageUrl } from "../utils/imageUrls.js";

// One of a fixed list of values. "fallback" (optional) is used when the value is missing.
function oneOf(values, message, fallback) {
  return z.preprocess(
    (value) =>
      value === undefined || value === null || value === ""
        ? (fallback ?? "")
        : value,
    z.string().refine((value) => values.includes(value), message),
  );
}

// Optional text: trimmed, cleaned, with a maximum length.
const optionalText = (max, message) =>
  z.preprocess(
    (value) => cleanText(blankIfMissing(value)),
    z.string().trim().max(max, message),
  );

const title = z.preprocess(
  (value) => cleanText(blankIfMissing(value)),
  z
    .string()
    .trim()
    .min(1, "Please enter a project title.")
    .min(3, "The title must be at least 3 characters.")
    .max(100, "The title must be 100 characters or fewer."),
);

// A web address ending, such as "marble-kitchen-island".
const slugRules = z
  .string()
  .min(1, "The web address cannot be empty.")
  .max(120, "The web address is too long.")
  .regex(
    SLUG_PATTERN,
    "Use only lowercase letters, numbers and single dashes, for example marble-kitchen-island.",
  );
const cleanSlug = (value) =>
  typeof value === "string"
    ? value.trim().toLowerCase()
    : blankIfMissing(value);

const slugStrict = z.preprocess(cleanSlug, slugRules);
// When creating, a blank web address means "make one from the title".
const slugOptional = z.preprocess((value) => {
  const slug = cleanSlug(value);
  return slug === "" ? undefined : slug;
}, slugRules.optional());

const categorySlug = z.preprocess(
  cleanSlug,
  z
    .string()
    .min(1, "Please choose a category.")
    .max(80, "Please choose a category.")
    .regex(SLUG_PATTERN, "Please choose a category."),
);

const location = optionalText(
  120,
  "The location must be 120 characters or fewer.",
).transform((value) => (value === "" ? null : value));

// One photo. The address must be one we control (see utils/imageUrls.js).
const photoSchema = z.object({
  url: z.preprocess(
    blankIfMissing,
    z
      .string()
      .trim()
      .min(1, "Each photo needs an image address.")
      .max(2048, "The image address is too long.")
      .refine(
        isAllowedImageUrl,
        "This photo address is not allowed. Photos must be uploaded through the admin.",
      ),
  ),
  fileId: z.preprocess(
    blankIfMissing,
    z.string().trim().max(200, "The file ID is too long."),
  ),
  alt: z.preprocess(
    (value) => cleanText(blankIfMissing(value)),
    z
      .string()
      .trim()
      .min(1, "Please describe the photo for people who cannot see it.")
      .max(200, "The description must be 200 characters or fewer."),
  ),
  caption: optionalText(150, "The caption must be 150 characters or fewer."),
});

const imagesRules = z
  .array(photoSchema)
  .max(
    MAX_PROJECT_IMAGES - 1,
    `A project can have up to ${MAX_PROJECT_IMAGES} photos including the cover.`,
  );

// Every field a project form can send. The server-controlled fields (id, isSample, timestamps)
// are not listed, so they are always stripped from requests.
const fields = {
  title,
  slug: slugStrict,
  service: oneOf(SERVICES, "Please choose Marble or POP."),
  category: categorySlug,
  description: optionalText(
    300,
    "The description must be 300 characters or fewer.",
  ),
  details: optionalText(1000, "The details must be 1000 characters or fewer."),
  location,
  coverImage: photoSchema,
  images: imagesRules,
  featured: z.boolean(),
  status: oneOf(
    PROJECT_STATUSES,
    "Please choose Draft, Published or Archived.",
  ),
};

// CREATING: title, service, category and a cover photo are required. The rest has defaults.
export const createProjectSchema = z.object({
  ...fields,
  slug: slugOptional,
  coverImage: z.preprocess((value) => value ?? {}, photoSchema),
  images: z.preprocess((value) => value ?? [], imagesRules),
  featured: z.preprocess((value) => value ?? false, z.boolean()),
  status: oneOf(
    PROJECT_STATUSES,
    "Please choose Draft, Published or Archived.",
    "draft",
  ),
});

// EDITING: send only the fields that changed (or all of them).
export const updateProjectSchema = z.object(fields).partial();
