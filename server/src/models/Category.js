import mongoose from "mongoose";
import { SERVICES, SLUG_PATTERN, imageSchema, baseOptions } from "./shared.js";
import { slugify, normalizeName } from "../utils/text.js";

const categorySchema = new mongoose.Schema(
  {
    // Made from the name when the category is created, and never changes afterwards
    // (shared links and projects depend on it). "immutable" enforces that.
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      immutable: true,
      match: [SLUG_PATTERN, "Invalid web address."],
    },
    // Which specialty the category belongs to. Also cannot change.
    service: { type: String, enum: SERVICES, required: true, immutable: true },
    name: {
      type: String,
      required: [true, "A category needs a name."],
      trim: true,
      minlength: 3,
      maxlength: 60,
    },
    // A simplified copy of the name used ONLY to block near-duplicates. The unique index
    // makes the database itself refuse "kitchen countertop" if "Kitchen Countertops" exists.
    nameKey: { type: String, unique: true },
    description: {
      type: String,
      required: [true, "A category needs a short description."],
      trim: true,
      minlength: 10,
      maxlength: 120,
    },
    // Optional category photo for the category card.
    image: { type: imageSchema, default: null },
    // Categories are archived (active: false), never deleted.
    active: { type: Boolean, default: true },
  },
  baseOptions,
);

// Runs automatically before validation on every save.
categorySchema.pre("validate", async function () {
  if (this.isNew && !this.slug && this.name) this.slug = slugify(this.name);
  if (this.name && this.isModified("name"))
    this.nameKey = normalizeName(this.name);
});

export default mongoose.model("Category", categorySchema);
