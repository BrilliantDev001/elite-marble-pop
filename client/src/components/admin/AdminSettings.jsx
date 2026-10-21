import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import FormField from "../shared/FormField";
import usePageMeta from "../../hooks/usePageMeta";

// Checks every field and returns an object of error messages (empty = all good).
// The real backend must run its own checks too. This is only for quick feedback.
function validate(values) {
  const errors = {};

  const phone = values.phoneDisplay.trim();
  const phoneDigits = phone.replace(/[\s\-()]/g, "");
  if (!phone) errors.phoneDisplay = "Please enter the business phone number.";
  else if (!/^\+?\d{7,15}$/.test(phoneDigits)) {
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

export default function AdminSettings() {
  usePageMeta("Admin: Settings");

  const { settings, setSettings } = useOutletContext();
  const [values, setValues] = useState(settings);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const messageRef = useRef(null);

  const hasChanges = Object.keys(values).some(
    (key) => values[key] !== settings[key],
  );

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const found = validate(values);
    setErrors(found);

    const order = ["phoneDisplay", "whatsappNumber", "email", "address"];
    const firstProblem = order.find((key) => found[key]);
    if (firstProblem) {
      document.getElementById(firstProblem)?.focus();
      return;
    }

    const cleaned = {
      phoneDisplay: values.phoneDisplay.trim(),
      whatsappNumber: values.whatsappNumber.trim(),
      email: values.email.trim(),
      address: values.address.trim(),
    };
    setSettings(cleaned);
    setValues(cleaned);
    setMessage("Settings saved for this session.");
    messageRef.current?.focus();
  }

  function handleDiscard() {
    setValues(settings);
    setErrors({});
    setMessage("Changes discarded.");
    messageRef.current?.focus();
  }

  return (
    <div>
      <h1 className="text-4xl font-medium md:text-5xl">Settings</h1>
      <p className="mt-3 max-w-2xl text-obsidian/80">
        Your business contact details. These will appear in the website footer,
        the contact page and the WhatsApp and phone buttons.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-obsidian/70">
        Prototype note: the values below are placeholders, and changes here do
        not alter the public pages of this demo site. Other website text stays
        in the code for now, which keeps the first version simple.
      </p>

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

        {/* Shows how the link will be built, so a typo is easy to spot */}
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

        <div className="flex flex-col gap-4 border-t border-obsidian/20 pt-8 sm:flex-row">
          <button type="submit" className="btn-primary">
            Save settings
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!hasChanges}
            className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard changes
          </button>
        </div>
      </form>
    </div>
  );
}
