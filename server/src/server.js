import mongoose from "mongoose";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function start() {
  try {
    await connectDB();
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    if (error.message.includes("querySrv")) {
      console.error(
        "Hint: your network may block the DNS lookup used by mongodb+srv:// strings. " +
          "Try the standard mongodb:// connection string from Atlas instead.",
      );
    }
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // Close the server and the database cleanly when the app is stopped (Ctrl+C or a host restart).
  function shutdown(signal) {
    console.log(`${signal} received. Shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  }
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
