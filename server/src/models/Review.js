import mongoose from "mongoose";
import {
  SERVICES,
  REVIEW_STATUSES,
  uploadedPhotoSchema,
  baseOptions,
} from "./shared.js";
import { httpError } from "../utils/httpError.js";

// A customer review. NEW REVIEWS ARE ALWAYS "pending". Nothing is public until the owner approves it.
// "approved" and "featured" are separate: a review can be approved without being featured.
const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name."],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    rating: {
      type: Number,
      required: [true, "Please choose a star rating."],
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "The rating must be a whole number.",
      },
    },
    // Plain text only. The website displays it as text (never as HTML).
    text: {
      type: String,
      required: [true, "Please write your review."],
      trim: true,
      minlength: 20,
      maxlength: 1000,
    },
    service: { type: String, enum: SERVICES, required: true },
    // Optional: the slug of the project the review is about.
    projectSlug: { type: String, trim: true, lowercase: true, default: null },
    // Optional photo, only allowed together with the customer's consent.
    photo: { type: uploadedPhotoSchema, default: null },
    photoConsent: { type: Boolean, default: false },
    status: { type: String, enum: REVIEW_STATUSES, default: "pending" },
    // Only an approved review can be featured on the home page.
    featured: { type: Boolean, default: false },
    // When the owner last approved or rejected it.
    moderatedAt: { type: Date, default: null },
  },
  baseOptions,
);

reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, featured: 1, createdAt: -1 });

// Runs before every save (and every validation). These rules can never be skipped.
reviewSchema.pre("validate", async function () {
  // A photo is only accepted with the customer's consent.
  if (this.photo && !this.photoConsent) {
    this.invalidate(
      "photoConsent",
      "Please confirm you are happy for the photo to be used.",
    );
  }
  // Only approved reviews can be featured.
  if (this.status !== "approved") this.featured = false;
  // Remember when the owner last moderated it.
  if (!this.isNew && this.isModified("status")) {
    this.moderatedAt = this.status === "pending" ? null : new Date();
  }
});

// ---------- Moderation actions ----------
// The admin API uses these instead of editing fields directly, so the rules live in ONE place.
// Always change reviews through these (or doc.save()): "findByIdAndUpdate" skips the rules above.

reviewSchema.methods.approve = function () {
  this.status = "approved";
  return this.save();
};

// Rejecting also removes the review from the home page.
reviewSchema.methods.reject = function () {
  this.status = "rejected";
  this.featured = false;
  return this.save();
};

reviewSchema.methods.setFeatured = function (value) {
  if (value && this.status !== "approved") {
    throw httpError(
      409,
      "Only approved reviews can be featured on the home page.",
    );
  }
  this.featured = Boolean(value);
  return this.save();
};

// What the PUBLIC website may see. Only ever call this on APPROVED reviews.
// It leaves out the status, moderation date and the file ID.
reviewSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    rating: this.rating,
    text: this.text,
    service: this.service,
    projectSlug: this.projectSlug,
    photo: this.photo
      ? {
          url: this.photo.url,
          alt: `Photo shared by ${this.name} with their review`,
        }
      : null,
    featured: this.featured,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Review", reviewSchema);
