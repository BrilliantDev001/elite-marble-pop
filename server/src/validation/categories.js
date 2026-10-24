import { z } from "zod";
import { SERVICES } from "../models/shared.js";
import { blankIfMissing, cleanText, oneOf } from "./common.js";
import { photoSchema } from "./projects.js";

const name = z.preprocess(
  (value) => cleanText(blankIfMissing(value)),
  z
    .string()
    .trim()
    .min(1, "Please enter a category name.")
    .min(3, "The name must be at least 3 characters.")
    .max(60, "The name must be 60 characters or fewer."),
);

const description = z.preprocess(
  (value) => cleanText(blankIfMissing(value)),
  z
    .string()
    .trim()
    .min(1, "Please enter a short description.")
    .min(10, "Please write at least 10 characters.")
    .max(120, "The description must be 120 characters or fewer."),
);

// CREATING: a name, a service and a description. The photo is optional.
// The web address is made from the name, and the service can never change afterwards.
export const createCategorySchema = z.object({
  name,
  service: oneOf(SERVICES, "Please choose Marble or POP."),
  description,
  image: z.preprocess((value) => value ?? null, photoSchema.nullable()),
});

// EDITING: send only what changed. "image: null" removes the photo.
// "active: false" archives the category, and "active: true" restores it.
// The service and web address are not listed, so they are always stripped.
export const updateCategorySchema = z
  .object({
    name,
    description,
    image: photoSchema.nullable(),
    active: z.boolean(),
  })
  .partial();
