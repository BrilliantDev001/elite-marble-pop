import { createUploadAuth } from "../utils/imagekit.js";
import { env } from "../config/env.js";
import { httpError } from "../utils/httpError.js";

// GET /api/admin/uploads/auth?purpose=project|category
// Gives the admin's browser a short-lived pass to upload ONE photo straight to ImageKit.
// (Only a logged-in admin can reach this: the route sits behind requireAdmin.)
export function getUploadAuth(req, res) {
  if (!env.imagekitConfigured)
    throw httpError(503, "Image uploads are not set up yet.");

  const { purpose } = res.locals.query;
  res.json(createUploadAuth(purpose));
}
