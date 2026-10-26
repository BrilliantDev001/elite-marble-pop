import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useSettings } from "../../context/settingsContext";
import { getPhoneLink, getWhatsAppLink } from "../../data/siteConfig";

// The business phone, WhatsApp and email links, from the contact details the API provides.
// Used by the footer, the quote band and the Contact page, so they always agree.
//
// While the details load, grey placeholders show. If they could not be loaded, a short message
// shows INSTEAD of any contact links, so a visitor can never tap a fake number.
//
// Props:
//   linkClassName   colours and hover style for the links (depends on the background)
//   listClassName   spacing and text size of the list
//   iconSize        size of the small icons
//   showAddress     also show the office address (when one is set)
//   whatsappMessage optional prefilled WhatsApp text
export default function ContactLinks({
  linkClassName = "",
  listClassName = "space-y-3 text-sm",
  iconSize = 16,
  showAddress = false,
  whatsappMessage,
}) {
  const { contact, status } = useSettings();

  if (status === "loading") {
    return (
      <div role="status" className={listClassName}>
        <span className="sr-only">Loading contact details...</span>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            aria-hidden="true"
            className="h-5 w-48 max-w-full animate-pulse bg-current/20"
          />
        ))}
      </div>
    );
  }

  if (!contact) {
    return (
      <p className="text-sm opacity-80">
        Contact details are unavailable right now. Please try again later.
      </p>
    );
  }

  const itemClass = `inline-flex items-center gap-2.5 ${linkClassName}`;

  return (
    <ul className={listClassName}>
      <li>
        <a href={getPhoneLink(contact)} className={itemClass}>
          <Phone size={iconSize} aria-hidden="true" />
          {contact.phoneDisplay}
        </a>
      </li>
      <li>
        <a
          href={getWhatsAppLink(whatsappMessage, contact)}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClass}
        >
          <MessageCircle size={iconSize} aria-hidden="true" />
          Chat on WhatsApp
        </a>
      </li>
      <li>
        <a href={`mailto:${contact.email}`} className={itemClass}>
          <Mail size={iconSize} aria-hidden="true" />
          {contact.email}
        </a>
      </li>
      {/* The address is optional: an empty one is simply not shown */}
      {showAddress && contact.address && (
        <li className="flex gap-3 pt-2">
          <MapPin
            size={iconSize}
            aria-hidden="true"
            className="mt-1 shrink-0"
          />
          <address className="not-italic">{contact.address}</address>
        </li>
      )}
    </ul>
  );
}
