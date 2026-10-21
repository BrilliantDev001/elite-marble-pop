import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// A simple check that the server is running and the database is connected.
// It reveals nothing private.
router.get("/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "database unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

export default router;
