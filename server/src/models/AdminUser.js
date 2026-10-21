import mongoose from "mongoose";
import { EMAIL_PATTERN, baseOptions } from "./shared.js";

// The owner's login. There is exactly one admin account, created by a script (Stage B3),
// not through a public sign-up page.
const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [EMAIL_PATTERN, "Please enter a valid email address."],
    },
    // The HASHED password, never the real one. "select: false" means it is left out of
    // every query unless the code explicitly asks for it (only the login check does).
    passwordHash: { type: String, required: true, select: false },
    // Raising this number instantly logs out every active session (used on logout and password change).
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  baseOptions,
);

export default mongoose.model("AdminUser", adminUserSchema);
