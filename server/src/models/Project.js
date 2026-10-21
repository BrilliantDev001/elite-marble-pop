import mongoose from "mongoose";
import {
  SERVICES,
  PROJECT_STATUSES,
  MAX_PROJECT_IMAGES,
  SLUG_PATTERN,
  imageSchema,
  baseOptions,
} from "./shared.js";

// A project is one completed job: one cover photo plus optional extra photos.
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A project needs a title."],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    // The page address: /gallery/<slug>. Unique across all projects.
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [
        SLUG_PATTERN,
        "Use only lowercase letters, numbers and single dashes.",
      ],
    },
    service: { type: String, enum: SERVICES, required: true },
    // The SLUG of a category (not a free-text name). The admin API checks that the category
    // exists and belongs to this service. Categories are never deleted, so this can't go stale.
    category: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    details: { type: String, trim: true, maxlength: 1000, default: "" },
    // Optional. Only filled in when the customer has agreed to it being public.
    location: { type: String, trim: true, maxlength: 120, default: null },
    coverImage: {
      type: imageSchema,
      required: [true, "A project needs a cover photo."],
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (list) => list.length <= MAX_PROJECT_IMAGES - 1,
        message: `A project can have up to ${MAX_PROJECT_IMAGES} photos including the cover.`,
      },
    },
    featured: { type: Boolean, default: false },
    // Only "published" projects ever appear on the public website.
    status: { type: String, enum: PROJECT_STATUSES, default: "draft" },
  },
  baseOptions,
);

// Indexes: make the gallery and home page queries fast as the collection grows.
projectSchema.index({ status: 1, service: 1, category: 1, createdAt: -1 });
projectSchema.index({ status: 1, featured: 1, createdAt: -1 });

export default mongoose.model("Project", projectSchema);
