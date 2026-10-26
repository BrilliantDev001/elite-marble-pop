// The statuses an enquiry can have. They are for the owner's own tracking only, not messages
// to the customer. These must match the list on the server.
export const ENQUIRY_STATUSES = [
  "New",
  "Contacted",
  "In Progress",
  "Completed",
  "Closed",
];

export const CONTACT_METHOD_LABELS = {
  phone: "Phone call",
  whatsapp: "WhatsApp",
  email: "Email",
};
