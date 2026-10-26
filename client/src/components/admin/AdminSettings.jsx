import { useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import FormField, { FieldError } from "../shared/FormField";
import LoadError from "../shared/LoadError";
import AdminFeedback from "./AdminFeedback";
import useApi from "../../hooks/useApi";
import usePageMeta from "../../hooks/usePageMeta";
import { useSettings } from "../../context/settingsContext";
import { apiRequest } from "../../services/api";

const FIELDS = ["phoneDisplay", "whatsappNumber", "email", "address"];

// Quick checks in the browser. The server checks everything again.
function validate(values) {
  const errors = {};

  const phone = values.phoneDisplay.trim();
  if (!phone) errors.phoneDisplay = "Please enter the business phone number.";
  else if (!/^\+?\d{7,15}$/.test(phone.replace(/[\s\-()]/g, ""))) {
    errors.phoneDisplay =
      "Please enter a valid phone number, for example +234 800 000 0000.";
  }

  const whatsapp = values.whatsappNumber.trim();
  if (!whatsapp) errors.whatsappNumber = "Please enter the WhatsApp number.";
  else if (!/^\d{7,15}$/.test(whatsapp)) {
    errors.whatsappNumber =
      "Use digits only, with the country code and no + sign, for example 2348000000000.";
  }

  const email = values.email.trim();
  if (!email) errors.email = "Please enter the business email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Please enter a valid email address.";

  if (values.address.trim().length > 200)
    errors.address = "The address must be 200 characters or fewer.";

  return errors;
}

// The form. It starts from the details the server sent.
function SettingsForm({ initial }) {
  const { reload: reloadPublicSettings } = useSettings();

  const [saved, setSaved] = useState(initial); // what the server currently holds
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const feedbackRef = useRef(null);

  const hasChanges = FIELDS.some(
    (field) => values[field].trim() !== saved[field],
  );

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const found = validate(values);
    setErrors(found);
    setFormError("");
    setFeedback(null);

    const firstProblem = FIELDS.find((field) => found[field]);
    if (firstProblem) {
      document.getElementById(firstProblem)?.focus();
      return;
    }

    // Send only what changed.
    const changes = {};
    for (const field of FIELDS) {
      const value = values[field].trim();
      if (value !== saved[field]) changes[field] = value;
    }
    if (Object.keys(changes).length === 0) {
      setFormError("Nothing has changed yet.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest("/api/admin/settings", {
        method: "PATCH",
        body: changes,
      });
      const next = Object.fromEntries(
        FIELDS.map((field) => [field, data.settings[field]]),
      );
      setSaved(next);
      setValues(next);
      setFeedback({
        type: "success",
        text: "Settings saved. The website now shows these contact details.",
      });
      reloadPublicSettings(); // so the public pages show the new details straight away
      feedbackRef.current?.focus();
    } catch (error) {
      const serverErrors = error.fields ?? {};
      const first = FIELDS.find((field) => serverErrors[field]);
      if (first) {
        setErrors(serverErrors);
        document.getElementById(first)?.focus();
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDiscard() {
    setValues(saved);
    setErrors({});
    setFormError("");
    setFeedback({ type: "success", text: "Changes discarded." });
    feedbackRef.current?.focus();
  }

  return (
    <>
      <AdminFeedback feedback={feedback} ref={feedbackRef} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-10 max-w-2xl space-y-8"
      >
        <FormField
          id="phoneDisplay"
          label="Phone number"
          error={errors.phoneDisplay}
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="tel"
              inputMode="tel"
              value={values.phoneDisplay}
              onChange={(event) => setField("phoneDisplay", event.target.value)}
            />
          )}
        </FormField>

        <FormField
          id="whatsappNumber"
          label="WhatsApp number"
          error={errors.whatsappNumber}
          hint="Digits only, with the country code and no + sign. This builds the WhatsApp link."
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              inputMode="numeric"
              value={values.whatsappNumber}
              onChange={(event) =>
                setField("whatsappNumber", event.target.value)
              }
            />
          )}
        </FormField>

        <FormField id="email" label="Email address" error={errors.email}>
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
            />
          )}
        </FormField>

        <FormField
          id="address"
          label="Office address"
          required={false}
          error={errors.address}
          hint="Leave this empty if you do not want a physical address shown on the website."
        >
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              rows={3}
              maxLength={200}
              value={values.address}
              onChange={(event) => setField("address", event.target.value)}
            />
          )}
        </FormField>

        {/* Shows how the links will be built, so a typo is easy to spot */}
        <div className="border border-obsidian/20 p-5 text-sm">
          <p className="font-semibold">
            Links that will be built from these details
          </p>
          <ul className="mt-3 space-y-1 break-all text-obsidian/85">
            <li>
              WhatsApp: https://wa.me/{values.whatsappNumber.trim() || "..."}
            </li>
            <li>
              Phone: tel:{values.phoneDisplay.replace(/[\s\-()]/g, "") || "..."}
            </li>
            <li>Email: mailto:{values.email.trim() || "..."}</li>
          </ul>
        </div>

        {formError && (
          <div role="alert">
            <FieldError>{formError}</FieldError>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-obsidian/20 pt-8 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              "Save settings"
            )}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!hasChanges || submitting}
            className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard changes
          </button>
        </div>
      </form>
    </>
  );
}

export default function AdminSettings() {
  usePageMeta("Admin: Settings");

  const { status, data, reload } = useApi("/api/admin/settings");

  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">Settings</h1>
      <p className="mt-3 max-w-2xl text-obsidian/80">
        Your business contact details. They appear in the website footer, on the
        contact page and in the WhatsApp and phone buttons. Other website text
        stays in the code for now, which keeps the first version simple.
      </p>

      {status === "loading" && (
        <div className="mt-10 max-w-2xl space-y-8">
          <p className="sr-only" role="status">
            Loading settings...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-16 animate-pulse bg-stone/20"
            />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="mt-10">
          <LoadError
            message="We could not load the settings."
            onRetry={reload}
          />
        </div>
      )}

      {status === "ready" && <SettingsForm initial={data.settings} />}
    </div>
  );
}
