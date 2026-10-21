import mongoose from "mongoose";

// Allowed values, shared by the models (and later by request validation).
export const SERVICES = ["marble", "pop"];
export const PROJECT_STATUSES = ["draft", "published", "archived"];
export const MAX_PROJECT_IMAGES = 20; // cover photo + extra photos, same limit as the admin form

// A web address ending: lowercase letters, numbers and single dashes, e.g. "marble-kitchen-island"
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// One photo. Used for project covers, extra project photos and category photos.
// The position of a photo in its list is its order. No separate order field is needed.
export const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "A photo needs an image address."],
      trim: true,
      maxlength: 2048,
    },
    // ImageKit's own ID for the file. Needed later to delete a photo from ImageKit.
    fileId: { type: String, trim: true, default: "" },
    alt: {
      type: String,
      required: [true, "Every photo needs alt text."],
      trim: true,
      maxlength: 200,
    },
    caption: { type: String, trim: true, maxlength: 150, default: "" },
  },
  { _id: false },
);

// Options shared by every model:
// - timestamps: automatic createdAt and updatedAt
// - toJSON: sends "id" instead of "_id", and hides "__v" and internal fields
export const baseOptions = {
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform(doc, ret) {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.nameKey;
      delete ret.passwordHash;
      delete ret.tokenVersion;
      return ret;
    },
  },
};

// ---------- More shared values (reviews, enquiries, admin) ----------

export const REVIEW_STATUSES = ["pending", "approved", "rejected"];
export const ENQUIRY_STATUSES = [
  "New",
  "Contacted",
  "In Progress",
  "Completed",
  "Closed",
];
export const CONTACT_METHODS = ["phone", "whatsapp", "email"];
export const MAX_ENQUIRY_PHOTOS = 3;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts spaces, dashes and brackets, then checks for 7 to 15 real digits (optional leading +).
export function isValidPhone(value) {
  return /^\+?\d{7,15}$/.test(String(value).replace(/[\s\-()]/g, ""));
}

// A photo uploaded by a visitor (a review photo or an enquiry reference image).
// Visitors give no alt text, so none is stored. When a review photo is shown publicly,
// the alt text is generated from the reviewer's name.
export const uploadedPhotoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    fileId: { type: String, trim: true, default: "" },
  },
  { _id: false },
);
