import { Router } from "express";
import { z } from "zod";
import {
  listEnquiries,
  getEnquiry,
  updateEnquiry,
} from "../controllers/adminEnquiryController.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { objectIdParam } from "../middleware/objectId.js";
import { oneOf, wholeNumber } from "../validation/common.js";
import { ENQUIRY_STATUSES, SERVICES } from "../models/shared.js";

const router = Router();
router.param("id", objectIdParam("Enquiry not found."));

const listQuery = z.object({
  status: z.enum(ENQUIRY_STATUSES).optional(),
  service: z.enum(SERVICES).optional(),
  page: wholeNumber("page", 100000).optional(),
  limit: wholeNumber("limit", 100).optional(),
});

// Only the status can be changed. Any other field in the request is ignored.
const statusSchema = z.object({
  status: oneOf(ENQUIRY_STATUSES, "Please choose a valid status."),
});

router.get("/", validateQuery(listQuery), listEnquiries);
router.get("/:id", getEnquiry);
router.patch("/:id", validateBody(statusSchema), updateEnquiry);

export default router;
