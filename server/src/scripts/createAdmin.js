import mongoose from "mongoose";
import { env } from "../config/env.js";
import AdminUser from "../models/AdminUser.js";
import { EMAIL_PATTERN } from "../models/shared.js";
import { hashPassword } from "../utils/session.js";

// Creates the owner account, or resets its password.
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from server/.env. Run:  npm run admin:create
//
// There is only ONE admin account. Running this again with the SAME email resets the
// password (and logs out every active session). A DIFFERENT email is refused.

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";

if (!EMAIL_PATTERN.test(email)) {
  console.error("Set ADMIN_EMAIL in server/.env to a valid email address.");
  process.exit(1);
}
// bcrypt only reads the first 72 characters, so we do not accept longer passwords.
if (password.length < 12 || password.length > 72) {
  console.error("ADMIN_PASSWORD must be between 12 and 72 characters. A long passphrase works well.");
  process.exit(1);
}

await mongoose.connect(env.mongoUri);

try {
  const admins = await AdminUser.find();
  const passwordHash = await hashPassword(password);

  if (admins.length === 0) {
    await AdminUser.create({ email, passwordHash });
    console.log(`Owner account created for ${email}.`);
  } else if (admins[0].email === email) {
    admins[0].passwordHash = passwordHash;
    admins[0].tokenVersion += 1; // logs out every active session
    await admins[0].save();
    console.log(`Password updated for ${email}. All active sessions were logged out.`);
  } else {
    console.error(`An owner account already exists for a different email (${admins[0].email}).`);
    console.error("Only one admin account is supported. Use the existing email, or ask me how to change it.");
    process.exitCode = 1;
  }
} finally {
  await mongoose.disconnect();
}

if (process.exitCode !== 1) {
  console.log("Now remove ADMIN_PASSWORD from server/.env so it is not left lying around.");
}