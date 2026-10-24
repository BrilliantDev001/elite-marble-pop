import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  listReviews,
  listFeaturedReviews,
  createReview,
  createEnquiry,
  REVIEW_THANKS,
  ENQUIRY_THANKS,
} from "../controllers/submissionController.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { honeypot } from "../middleware/honeypot.js";
import { reviewSchema, enquirySchema } from "../validation/submissions.js";
import { wholeNumber } from "../validation/common.js";

const router = Router();

// Limits on SUCCESSFUL submissions per address per hour. Failed attempts (400 errors) are not
// counted: they save nothing. Honest visitors on a shared mobile network are not punished
// for each other's mistakes.
function submissionLimiter(limit, message) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit,
    skipFailedRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });
}

const reviewLimiter = submissionLimiter(
  5,
  "You have sent several reviews recently. Please try again later.",
);
const enquiryLimiter = submissionLimiter(
  10,
  "You have sent several enquiries recently. Please try again later.",
);

const reviewsQuery = z.object({
  page: wholeNumber("page", 100000).optional(),
  limit: wholeNumber("limit", 24).optional(),
});
const featuredQuery = z.object({
  limit: wholeNumber("limit", 6).optional(),
});

// Public reading: approved reviews only.
router.get("/reviews", validateQuery(reviewsQuery), listReviews);
router.get(
  "/reviews/featured",
  validateQuery(featuredQuery),
  listFeaturedReviews,
);

// Public writing. Order matters: limit, then the spam trap, then validation, then saving.
router.post(
  "/reviews",
  reviewLimiter,
  honeypot(REVIEW_THANKS),
  validateBody(reviewSchema),
  createReview,
);
router.post(
  "/enquiries",
  enquiryLimiter,
  honeypot(ENQUIRY_THANKS),
  validateBody(enquirySchema),
  createEnquiry,
);

export default router;
