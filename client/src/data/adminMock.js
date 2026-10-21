import { reviews as publicReviews } from "./reviews";
import { siteConfig } from "./siteConfig";

// MOCK DATA for the admin PROTOTYPE only. None of this is real.
// It exists so the owner can see how moderation and enquiry tracking will feel.
// The real versions will come from the database in the backend phase.

// The statuses an enquiry can have. They are for the owner's own tracking only.
export const ENQUIRY_STATUSES = [
  "New",
  "Contacted",
  "In Progress",
  "Completed",
  "Closed",
];

// Extra mock reviews, so the owner can try approving, rejecting and featuring.
// The one placeholder review from reviews.js is included too (already approved and featured).
const mockReviews = [
  {
    id: "m1",
    name: "Mock Reviewer One",
    rating: 4,
    text: "MOCK REVIEW for testing moderation. This one is waiting for the owner to approve or reject it.",
    service: "pop",
    projectSlug: null,
    status: "pending",
    featured: false,
    isPlaceholder: true,
    createdAt: "2026-03-18",
  },
  {
    id: "m2",
    name: "Mock Reviewer Two",
    rating: 5,
    text: "MOCK REVIEW for testing moderation. Approve it, then try featuring it for the home page.",
    service: "marble",
    projectSlug: "marble-kitchen-island",
    status: "pending",
    featured: false,
    isPlaceholder: true,
    createdAt: "2026-03-19",
  },
  {
    id: "m3",
    name: "Mock Reviewer Three",
    rating: 2,
    text: "MOCK REVIEW for testing moderation. This one has already been rejected.",
    service: "marble",
    projectSlug: null,
    status: "rejected",
    featured: false,
    isPlaceholder: true,
    createdAt: "2026-03-10",
  },
];

export const initialAdminReviews = [...publicReviews, ...mockReviews];

// Mock enquiries (NOT real customers). Phone numbers and emails are fake.
export const initialAdminEnquiries = [
  {
    id: "e1",
    name: "Mock Customer A",
    phone: "+234 800 000 0001",
    email: "mock.a@example.com",
    contactMethod: "whatsapp",
    service: "marble",
    category: "kitchen-countertops",
    location: "Sample Area, Lagos",
    description:
      "MOCK ENQUIRY for testing. Asking about a countertop for a kitchen of about this size.",
    photoCount: 2,
    status: "New",
    createdAt: "2026-03-21",
  },
  {
    id: "e2",
    name: "Mock Customer B",
    phone: "+234 800 000 0002",
    email: "",
    contactMethod: "phone",
    service: "pop",
    category: "decorative-ceilings",
    location: "Sample Town",
    description:
      "MOCK ENQUIRY for testing. Interested in a layered ceiling design for a living room.",
    photoCount: 0,
    status: "New",
    createdAt: "2026-03-20",
  },
  {
    id: "e3",
    name: "Mock Customer C",
    phone: "+234 800 000 0003",
    email: "mock.c@example.com",
    contactMethod: "email",
    service: "marble",
    category: "staircases-and-flooring",
    location: "Another Sample Area",
    description:
      "MOCK ENQUIRY for testing. Wants marble steps and a matching floor for an entrance hall.",
    photoCount: 1,
    status: "In Progress",
    createdAt: "2026-03-14",
  },
  {
    id: "e4",
    name: "Mock Customer D",
    phone: "+234 800 000 0004",
    email: "",
    contactMethod: "phone",
    service: "pop",
    category: "ceiling-mouldings-cornices",
    location: "Sample City",
    description:
      "MOCK ENQUIRY for testing. Asking about cornices for two rooms.",
    photoCount: 0,
    status: "Completed",
    createdAt: "2026-02-27",
  },
];

// Starting values for the Settings screen (copied from siteConfig.js).
export const initialAdminSettings = {
  phoneDisplay: siteConfig.contact.phoneDisplay,
  whatsappNumber: siteConfig.contact.whatsappNumber,
  email: siteConfig.contact.email,
  address: siteConfig.contact.address,
};

// Turns "2026-03-18" into "18 Mar 2026" for the admin screens.
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Turns a title into a web-address-friendly slug: "Marble Kitchen Island" -> "marble-kitchen-island"
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Reduces a name to a comparable form so near-duplicates are caught:
// "Kitchen Countertops", "kitchen countertop" and "Kitchen  Countertop!" all match.
// ("&" and "and" are treated the same, and a trailing "s" on each word is ignored.)
export function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/s$/, ""))
    .join(" ");
}

// Today's date as "2026-03-21".
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
