import { Router } from "express";
import { z } from "zod";
import {
  listCategories,
  listProjects,
  getProject,
  getSettings,
} from "../controllers/publicController.js";
import { validateQuery } from "../middleware/validate.js";
import { SERVICES, SLUG_PATTERN } from "../models/shared.js";

const router = Router();

// A whole number between 1 and `max`, read from the web address (where everything is text).
const wholeNumber = (name, max) =>
  z
    .string()
    .regex(/^\d{1,6}$/, `${name} must be a whole number.`)
    .transform(Number)
    .refine(
      (value) => value >= 1 && value <= max,
      `${name} must be between 1 and ${max}.`,
    );

// Every filter is optional. Only these exact values are accepted.
// (A repeated filter like ?service=a&service=b is rejected too.)
const categoriesQuery = z.object({
  service: z.enum(SERVICES).optional(),
});

const projectsQuery = z.object({
  service: z.enum(SERVICES).optional(),
  category: z
    .string()
    .max(80)
    .regex(SLUG_PATTERN, "category is not a valid web address ending.")
    .optional(),
  featured: z.enum(["true"]).optional(),
  page: wholeNumber("page", 100000).optional(),
  limit: wholeNumber("limit", 24).optional(),
});

router.get("/categories", validateQuery(categoriesQuery), listCategories);
router.get("/projects", validateQuery(projectsQuery), listProjects);
router.get("/projects/:slug", getProject);
router.get("/settings", getSettings);

export default router;
