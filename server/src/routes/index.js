import { Router } from "express";
import mongoose from "mongoose";
import { noStore, requireAdmin, requireSameOrigin } from "../middleware/auth.js";
import adminProjectRoutes from "./adminProjectRoutes.js";
import adminReviewRoutes from "./adminReviewRoutes.js";
import adminEnquiryRoutes from "./adminEnquiryRoutes.js";
import adminCategoryRoutes from "./adminCategoryRoutes.js";
import adminSettingsRoutes from "./adminSettingsRoutes.js";
import adminUploadRoutes from "./adminUploadRoutes.js";
import { getOverview } from "../controllers/adminOverviewController.js";
import adminAuthRoutes from "./adminAuthRoutes.js";
import publicRoutes from "./publicRoutes.js";
import submissionRoutes from "./submissionRoutes.js";

const router = Router();

// A simple check that the server is running and the database is connected.
// Revealing nothing private.
router.get("/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "database unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

// ---------- Public routes (no login needed, read-only) ----------
router.use(publicRoutes);
router.use(submissionRoutes);

// ---------- Admin routes (everything under /api/admin) ----------
// Any POST, PATCH or DELETE must come from our own website (CSRF protection).
router.use("/admin", noStore, requireSameOrigin);
router.use("/admin/auth", adminAuthRoutes);
router.use("/admin/projects", requireAdmin, adminProjectRoutes);
router.use("/admin/reviews", requireAdmin, adminReviewRoutes);
router.use("/admin/enquiries", requireAdmin, adminEnquiryRoutes);
router.use("/admin/categories", requireAdmin, adminCategoryRoutes);
router.use("/admin/settings", requireAdmin, adminSettingsRoutes);
router.use("/admin/uploads", requireAdmin, adminUploadRoutes);
router.get("/admin/overview", requireAdmin, getOverview);

export default router;
