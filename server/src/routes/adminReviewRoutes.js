import { Router } from "express";
import { z } from "zod";
import {
  listReviews,
  getReview,
  updateReview,
} from "../controllers/adminReviewController.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { objectIdParam } from "../middleware/objectId.js";
import { oneOf, wholeNumber } from "../validation/common.js";
import { REVIEW_STATUSES } from "../models/shared.js";

const router = Router();
router.param("id", objectIdParam("Review not found."));

const listQuery = z.object({
  status: z.enum(REVIEW_STATUSES).optional(),
  page: wholeNumber("page", 100000).optional(),
  limit: wholeNumber("limit", 100).optional(),
});

// The only thing the admin can send is WHICH moderation action to perform.
const actionSchema = z.object({
  action: oneOf(
    ["approve", "reject", "feature", "unfeature"],
    "Please choose approve, reject, feature or unfeature.",
  ),
});

router.get("/", validateQuery(listQuery), listReviews);
router.get("/:id", getReview);
router.patch("/:id", validateBody(actionSchema), updateReview);

export default router;
