import mongoose from "mongoose";
import { env } from "./env.js";

// Connects to MongoDB. If it cannot connect within 10 seconds, it throws,
// and server.js stops the app with a clear message.
export async function connectDB() {
  // Safety: ignore unknown fields when filtering queries.
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });

  // We log only the database name, never the connection string (it contains the password).
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
