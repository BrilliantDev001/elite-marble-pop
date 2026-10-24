import Project from "../models/Project.js";
import Review from "../models/Review.js";
import Enquiry from "../models/Enquiry.js";
import {
  PROJECT_STATUSES,
  REVIEW_STATUSES,
  ENQUIRY_STATUSES,
} from "../models/shared.js";
import { countBy } from "../utils/counts.js";

// GET /api/admin/overview
// Real counts for the dashboard and the side-menu badges. Nothing is invented: with no data,
// every number is simply 0.
export async function getOverview(req, res) {
  const [projects, reviews, enquiries] = await Promise.all([
    countBy(Project, "status", PROJECT_STATUSES),
    countBy(Review, "status", REVIEW_STATUSES),
    countBy(Enquiry, "status", ENQUIRY_STATUSES),
  ]);

  res.json({ projects, reviews, enquiries });
}
