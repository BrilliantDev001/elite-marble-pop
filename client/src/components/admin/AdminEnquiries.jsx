import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronDown, ChevronUp, Mail, Phone } from "lucide-react";
import FilterTabs from "./FilterTabs";
import AdminFeedback from "./AdminFeedback";
import LoadMore from "./LoadMore";
import LoadError from "../shared/LoadError";
import usePagedApi from "../../hooks/usePagedApi";
import usePageMeta from "../../hooks/usePageMeta";
import { apiRequest } from "../../services/api";
import { getServiceBySlug } from "../../data/services";
import { formatDate } from "../../utils/dates";
import { CONTACT_METHOD_LABELS, ENQUIRY_STATUSES } from "../../utils/enquiries";

const FILTERS = [
  { value: "all", label: "All" },
  ...ENQUIRY_STATUSES.map((status) => ({ value: status, label: status })),
];

export default function AdminEnquiries() {
  usePageMeta("Admin: Enquiries");

  const { counts, refreshCounts } = useOutletContext();
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null); // which enquiry's details are open
  const [feedback, setFeedback] = useState(null);
  const [busyId, setBusyId] = useState(null); // the enquiry a status change is running for
  const feedbackRef = useRef(null);

  // The enquiries for the chosen tab, loaded from the server.
  const list = usePagedApi(
    "/api/admin/enquiries",
    { status: filter === "all" ? "" : filter },
    20,
  );

  const options = FILTERS.map((item) => ({
    ...item,
    count: counts?.enquiries[item.value],
  }));

  // The status is the ONLY thing that can change. The server saves it and answers with the updated enquiry.
  async function changeStatus(enquiry, status) {
    if (busyId || status === enquiry.status) return;
    setBusyId(enquiry.id);
    setFeedback(null);

    try {
      const data = await apiRequest(`/api/admin/enquiries/${enquiry.id}`, {
        method: "PATCH",
        body: { status },
      });
      const updated = data.enquiry;

      const stays = filter === "all" || updated.status === filter;
      list.patchItems((items) =>
        stays
          ? items.map((item) => (item.id === updated.id ? updated : item))
          : items.filter((item) => item.id !== updated.id),
      );

      setFeedback({
        type: "success",
        text: `Status for ${enquiry.name} changed to "${status}".`,
      });
      refreshCounts();

      // The enquiry left this tab, so move focus to the message instead of losing it.
      if (!stays) feedbackRef.current?.focus();
    } catch (error) {
      // The menu keeps showing the old status, because nothing was saved.
      setFeedback({ type: "error", text: error.message });
      feedbackRef.current?.focus();
    } finally {
      setBusyId(null);
    }
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
        the customer.
      </p>

      <FilterTabs
        label="Filter enquiries by status"
        options={options}
        value={filter}
        onChange={setFilter}
      />

      <AdminFeedback feedback={feedback} ref={feedbackRef} />

      {list.status === "loading" && (
        <div className="mt-8 space-y-6">
          <p className="sr-only" role="status">
            Loading enquiries...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-32 animate-pulse bg-stone/20"
            />
          ))}
        </div>
      )}

      {list.status === "error" && (
        <div className="mt-8">
          <LoadError
            message="We could not load the enquiries."
            onRetry={list.reload}
          />
        </div>
      )}

      {list.status === "ready" &&
        (list.items.length > 0 ? (
          <>
            <ul className="mt-8 space-y-6">
              {list.items.map((enquiry) => {
                const service = getServiceBySlug(enquiry.service);
                const isOpen = openId === enquiry.id;
                const detailsId = `enquiry-details-${enquiry.id}`;
                const busy = busyId === enquiry.id;

                return (
                  <li key={enquiry.id}>
                    <article className="border border-obsidian/25 p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h2 className="text-2xl font-medium">
                            {enquiry.name}
                          </h2>
                          <p className="mt-1 text-sm text-obsidian/80">
                            {service?.name}
                            {enquiry.categoryName &&
                              ` · ${enquiry.categoryName}`}{" "}
                            · {formatDate(enquiry.createdAt)}
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
                            disabled={busy}
                            aria-busy={busy}
                            onChange={(event) =>
                              changeStatus(enquiry, event.target.value)
                            }
                            className="min-h-11 w-full border border-obsidian/40 bg-white/70 px-3 text-base disabled:cursor-not-allowed disabled:opacity-70"
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
                              <dt className="font-semibold">
                                Project location
                              </dt>
                              <dd>{enquiry.location}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="font-semibold">
                                Project description
                              </dt>
                              <dd className="mt-1 max-w-2xl whitespace-pre-line">
                                {enquiry.description}
                              </dd>
                            </div>
                          </dl>

                          <div className="mt-6 flex flex-wrap gap-3">
                            <a
                              href={`tel:${enquiry.phone.replace(/[\s\-()]/g, "")}`}
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

            <LoadMore
              hasMore={list.hasMore}
              loadingMore={list.loadingMore}
              moreError={list.moreError}
              onLoadMore={list.loadMore}
            />
          </>
        ) : (
          <div className="mt-8 max-w-xl border border-obsidian/20 p-8">
            <p className="font-heading text-2xl">
              {filter === "all"
                ? "No enquiries yet."
                : `No enquiries marked "${filter}".`}
            </p>
            <p className="mt-2 text-obsidian/80">
              Quotation requests from the contact form will appear here.
            </p>
          </div>
        ))}
    </div>
  );
}
