import { Router } from "express";
import { z } from "zod";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
} from "../controllers/adminProjectController.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validation/projects.js";
import { wholeNumber } from "../validation/common.js";
import { SERVICES, PROJECT_STATUSES, SLUG_PATTERN } from "../models/shared.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

// Anything that does not look like a database ID is simply "not found".
router.param("id", (req, res, next, id) => {
  if (!/^[a-f0-9]{24}$/i.test(id))
    return next(httpError(404, "Project not found."));
  next();
});

const listQuery = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  service: z.enum(SERVICES).optional(),
  category: z
    .string()
    .max(80)
    .regex(SLUG_PATTERN, "category is not a valid web address ending.")
    .optional(),
  page: wholeNumber("page", 100000).optional(),
  limit: wholeNumber("limit", 100).optional(),
});

// There is deliberately NO delete route. Projects are archived instead.
router.get("/", validateQuery(listQuery), listProjects);
router.post("/", validateBody(createProjectSchema), createProject);
router.get("/:id", getProject);
router.patch("/:id", validateBody(updateProjectSchema), updateProject);

export default router;
