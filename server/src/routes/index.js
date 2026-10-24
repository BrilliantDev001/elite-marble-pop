import { Router } from "express";
import mongoose from "mongoose";
import { requireAdmin, requireSameOrigin } from "../middleware/auth.js";
import adminProjectRoutes from "./adminProjectRoutes.js";
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
router.use("/admin", requireSameOrigin);
router.use("/admin/auth", adminAuthRoutes);
router.use("/admin/projects", requireAdmin, adminProjectRoutes);

export default router;
