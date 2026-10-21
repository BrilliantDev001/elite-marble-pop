import mongoose from "mongoose";
import { EMAIL_PATTERN, isValidPhone, baseOptions } from "./shared.js";

// The business contact details shown on the website. There is only ONE settings record.
//
// The default values below are the same FAKE PLACEHOLDERS the frontend uses, so the site
// works before the owner has entered real details. The owner replaces them in Admin > Settings.
// Launch checklist: make sure these have been changed to real details.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true, immutable: true },
    phoneDisplay: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "+234 800 000 0000",
      validate: {
        validator: isValidPhone,
        message: "Please enter a valid phone number.",
      },
    },
    // Digits only, with the country code and no + sign. Used to build the WhatsApp link.
    whatsappNumber: {
      type: String,
      trim: true,
      default: "2348000000000",
      match: [
        /^\d{7,15}$/,
        "Use digits only, with the country code and no + sign.",
      ],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: "example@gmail.com",
      match: [EMAIL_PATTERN, "Please enter a valid email address."],
    },
    // Optional. Empty means no physical address is shown on the website.
    address: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "12 Sample Street, Ikeja, Lagos, Nigeria",
    },
  },
  baseOptions,
);

// Returns the one settings record, creating it with the defaults the first time.
settingsSchema.statics.getSite = function () {
  return this.findOneAndUpdate(
    { key: "site" },
    { $setOnInsert: { key: "site" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
};

export default mongoose.model("Settings", settingsSchema);
