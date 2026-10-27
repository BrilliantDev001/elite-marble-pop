import { makeImage } from "./images";
// Business details and navigation, kept in one place.
// ALL contact details below are FAKE PLACEHOLDERS. The owner will edit them
// from the admin panel once the backend exists.

export const siteConfig = {
  name: "ELITE",
  descriptor: "MARBLE & POP WORKS LTD.",
  positioning: "PREMIUM INTERIOR FINISHING",

  // The contact details now come from the API (the owner edits them in Admin > Settings).
  // This is the FAKE WhatsApp number the API starts with. It is kept ONLY so the site can remind
  // you, in development, that real contact details have not been entered yet.
  placeholderWhatsappNumber: "2348000000000",

  quoteCtaLabel: "Request a Personalized Quote",

  // While true, a slim banner on every public page says the content is placeholder.
  // Set to false before launch, once real photos, projects and contact details are in.
  demoMode: true,

  // Photo for the About section. Replace with a real photo of the owner at work.
  aboutImage: makeImage(
    "about-artisan.jpg",
    "Craftsperson shaping and finishing a surface by hand in a workshop",
  ),
};

// Main navigation. "About" is a section on the home page, so it is not listed here.
export const navLinks = [
  { label: "Home", to: "/" },
  { label: "Marble Works", to: "/marble" },
  { label: "POP Works", to: "/pop" },
  { label: "Gallery", to: "/gallery" },
  { label: "Reviews", to: "/reviews" },
  { label: "Contact", to: "/contact" },
];

// Builds a WhatsApp link with a short prefilled message.
// Usage: getWhatsAppLink("Hello ELITE, I'd like a quote for Kitchen Countertops.")
export function getWhatsAppLink(
  message = "Hello ELITE, I would like to request a quote.",
  contact,
) {
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// Builds a phone link: <a href={getPhoneLink()}>
export function getPhoneLink(contact) {
  return `tel:${contact.phoneHref}`;
}

// True while the contact details are still the fake placeholders from this file.
// Only used for a reminder that is shown in development.
export function isPlaceholderContact(contact) {
  return contact?.whatsappNumber === siteConfig.placeholderWhatsappNumber;
}