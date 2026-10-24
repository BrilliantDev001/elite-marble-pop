import { Router } from "express";
import { z } from "zod";
import {
  listCategories,
  createCategory,
  updateCategory,
} from "../controllers/adminCategoryController.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validation/categories.js";
import { SERVICES, SLUG_PATTERN } from "../models/shared.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

// A category is identified by its web address ending. Anything that is not a valid one is "not found".
router.param("slug", (req, res, next, slug) => {
  if (slug.length > 80 || !SLUG_PATTERN.test(slug))
    return next(httpError(404, "Category not found."));
  next();
});

const listQuery = z.object({
  service: z.enum(SERVICES).optional(),
  active: z.enum(["true", "false"]).optional(),
});

// There is deliberately NO delete route. Categories are archived instead,
// so projects can never be left pointing at a missing category.
router.get("/", validateQuery(listQuery), listCategories);
router.post("/", validateBody(createCategorySchema), createCategory);
router.patch("/:slug", validateBody(updateCategorySchema), updateCategory);

export default router;
