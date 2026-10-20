// Business details and navigation, kept in one place.
// ALL contact details below are FAKE PLACEHOLDERS. The owner will edit them
// from the admin panel once the backend exists.

export const siteConfig = {
  name: "ELITE",
  descriptor: "MARBLE & POP WORKS LTD.",
  positioning: "PREMIUM INTERIOR FINISHING",

  contact: {
    isPlaceholder: true,
    phoneDisplay: "+234 800 000 0000",
    phoneHref: "+2348000000000", // used in tel: links
    whatsappNumber: "2348000000000", // digits only, no + sign
    email: "example@gmail.com",
    address: "12 Sample Street, Ikeja, Lagos, Nigeria", // generic placeholder
  },

  quoteCtaLabel: "Request a Personalised Quote",
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
) {
  return `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// Builds a phone link: <a href={getPhoneLink()}>
export function getPhoneLink() {
  return `tel:${siteConfig.contact.phoneHref}`;
}
