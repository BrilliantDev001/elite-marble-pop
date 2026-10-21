import mongoose from "mongoose";
import {
  SERVICES,
  ENQUIRY_STATUSES,
  CONTACT_METHODS,
  MAX_ENQUIRY_PHOTOS,
  EMAIL_PATTERN,
  isValidPhone,
  uploadedPhotoSchema,
  baseOptions,
} from "./shared.js";

// A quotation request from the contact form.
// PRIVATE: there is deliberately NO public version of this model. Enquiries are only ever
// returned by protected admin routes. The status is for the owner's own tracking only.
const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name."],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    phone: {
      type: String,
      required: [true, "Please enter a phone number."],
      trim: true,
      maxlength: 30,
      validate: {
        validator: isValidPhone,
        message: "Please enter a valid phone number.",
      },
    },
    // Optional, unless the customer asked to be contacted by email.
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: "",
      validate: {
        validator: (value) => value === "" || EMAIL_PATTERN.test(value),
        message: "Please enter a valid email address.",
      },
    },
    contactMethod: {
      type: String,
      enum: CONTACT_METHODS,
      required: [true, "Please choose how to be contacted."],
    },
    service: { type: String, enum: SERVICES, required: true },
    // Optional: a category slug. The API checks it belongs to the chosen service.
    category: { type: String, trim: true, lowercase: true, default: "" },
    location: {
      type: String,
      required: [true, "Please enter the project location."],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Please describe your project."],
      trim: true,
      minlength: 20,
      maxlength: 1500,
    },
    photos: {
      type: [uploadedPhotoSchema],
      default: [],
      validate: {
        validator: (list) => list.length <= MAX_ENQUIRY_PHOTOS,
        message: `No more than ${MAX_ENQUIRY_PHOTOS} reference images.`,
      },
    },
    // The customer must agree to us using their details to reply. createdAt records when.
    consent: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: "Consent is required to send an enquiry.",
      },
    },
    status: { type: String, enum: ENQUIRY_STATUSES, default: "New" },
  },
  baseOptions,
);

enquirySchema.index({ status: 1, createdAt: -1 });

enquirySchema.pre("validate", async function () {
  if (this.contactMethod === "email" && !this.email) {
    this.invalidate(
      "email",
      "Please enter your email address, since you chose email as your contact method.",
    );
  }
});

export default mongoose.model("Enquiry", enquirySchema);
