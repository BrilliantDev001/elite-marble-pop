import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronDown, ChevronUp, Mail, Phone } from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";
import { getServiceBySlug } from "../../data/services";
import { getCategoryBySlug } from "../../data/categories";
import { ENQUIRY_STATUSES, formatDate } from "../../data/adminMock";

const CONTACT_METHOD_LABELS = {
  phone: "Phone call",
  whatsapp: "WhatsApp",
  email: "Email",
};

const FILTERS = ["All", ...ENQUIRY_STATUSES];

export default function AdminEnquiries() {
  usePageMeta("Admin: Enquiries");

  const { enquiries, setEnquiries } = useOutletContext();
  const [filter, setFilter] = useState("All");
  const [openId, setOpenId] = useState(null); // which enquiry's details are open
  const [message, setMessage] = useState("");
  const messageRef = useRef(null);

  const countFor = (value) =>
    value === "All"
      ? enquiries.length
      : enquiries.filter((item) => item.status === value).length;

  const shown = enquiries
    .filter((item) => filter === "All" || item.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function changeStatus(enquiry, newStatus) {
    setEnquiries((current) =>
      current.map((item) =>
        item.id === enquiry.id ? { ...item, status: newStatus } : item,
      ),
    );
    setMessage(`Status for ${enquiry.name} changed to "${newStatus}".`);

    // If the enquiry leaves the current tab, move focus to the message
    // so keyboard users do not lose their place.
    if (filter !== "All" && newStatus !== filter) messageRef.current?.focus();
  }

  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">Enquiries</h1>
      <p className="mt-3 max-w-2xl text-obsidian/80">
        Quotation requests from the contact form. Customer details are private:
        they appear only here and never on the public website.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-obsidian/70">
        Statuses are for your own tracking. They are not promises or messages to
        the customer. All enquiries below are mock data.
      </p>

      {/* Status filter */}
      <div
        className="mt-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter enquiries by status"
      >
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-medium transition-colors ${
              filter === value
                ? "border-obsidian bg-obsidian text-ivory"
                : "border-obsidian/30 hover:border-obsidian"
            }`}
          >
            {value}
            <span className="text-xs opacity-80">({countFor(value)})</span>
          </button>
        ))}
      </div>

      <p
        ref={messageRef}
        role="status"
        tabIndex={-1}
        className={`mt-6 border-l-2 border-gold pl-4 text-sm focus:outline-none ${
          message ? "" : "sr-only"
        }`}
      >
        {message}
      </p>

      {shown.length > 0 ? (
        <ul className="mt-8 space-y-6">
          {shown.map((enquiry) => {
            const service = getServiceBySlug(enquiry.service);
            const category = getCategoryBySlug(enquiry.category);
            const isOpen = openId === enquiry.id;
            const detailsId = `enquiry-details-${enquiry.id}`;

            return (
              <li key={enquiry.id}>
                <article className="border border-obsidian/25 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-medium">{enquiry.name}</h2>
                      <p className="mt-1 text-sm text-obsidian/80">
                        {service?.name}
                        {category && ` · ${category.name}`} ·{" "}
                        {formatDate(enquiry.createdAt)}
                      </p>
                    </div>

                    <div className="md:w-48">
                      <label
                        htmlFor={`status-${enquiry.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Status
                      </label>
                      <select
                        id={`status-${enquiry.id}`}
                        value={enquiry.status}
                        onChange={(event) =>
                          changeStatus(enquiry, event.target.value)
                        }
                        className="min-h-11 w-full border border-obsidian/40 bg-white/70 px-3 text-base"
                      >
                        {ENQUIRY_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : enquiry.id)}
                    aria-expanded={isOpen}
                    aria-controls={detailsId}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
                  >
                    {isOpen ? "Hide details" : "View details"}
                    {isOpen ? (
                      <ChevronUp size={16} aria-hidden="true" />
                    ) : (
                      <ChevronDown size={16} aria-hidden="true" />
                    )}
                  </button>

                  {isOpen && (
                    <div
                      id={detailsId}
                      className="mt-4 border-t border-obsidian/15 pt-5"
                    >
                      <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold">Phone</dt>
                          <dd>{enquiry.phone}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Email</dt>
                          <dd>{enquiry.email || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">
                            Preferred contact method
                          </dt>
                          <dd>
                            {CONTACT_METHOD_LABELS[enquiry.contactMethod]}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Project location</dt>
                          <dd>{enquiry.location}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="font-semibold">Project description</dt>
                          <dd className="mt-1 max-w-2xl">
                            {enquiry.description}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="font-semibold">Reference images</dt>
                          <dd>
                            {enquiry.photoCount > 0
                              ? `${enquiry.photoCount} attached (previews are not shown in the prototype)`
                              : "None attached"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <a
                          href={`tel:${enquiry.phone.replace(/\s/g, "")}`}
                          className="btn-outline btn-sm"
                        >
                          <Phone size={14} aria-hidden="true" />
                          Call {enquiry.name}
                        </a>
                        {enquiry.email && (
                          <a
                            href={`mailto:${enquiry.email}`}
                            className="btn-outline btn-sm"
                          >
                            <Mail size={14} aria-hidden="true" />
                            Email {enquiry.name}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8 max-w-xl border border-obsidian/20 p-8">
          <p className="font-heading text-2xl">
            {filter === "All"
              ? "No enquiries yet."
              : `No enquiries marked "${filter}".`}
          </p>
          <p className="mt-2 text-obsidian/80">
            Quotation requests from the contact form will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
