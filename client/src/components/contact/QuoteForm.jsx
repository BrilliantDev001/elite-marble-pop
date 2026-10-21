import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleAlert, LoaderCircle, MessageCircle } from "lucide-react";
import FormField, { FieldError, inputClass } from "../shared/FormField";
import { services, getServiceBySlug } from "../../data/services";
import {
  getCategoriesByService,
  getCategoryBySlug,
} from "../../data/categories";
import { getWhatsAppLink } from "../../data/siteConfig";

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB each
const MAX_PHOTOS = 3;
const MAX_DESCRIPTION_LENGTH = 1500;

const contactMethods = [
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

// Focus goes to the FIRST problem field, in the same order as the form.
const FOCUS_ORDER = [
  ["name", "name"],
  ["phone", "phone"],
  ["email", "email"],
  ["contactMethod", "contactMethod-phone"],
  ["service", "service"],
  ["category", "category"],
  ["location", "location"],
  ["description", "description"],
  ["photos", "photos"],
  ["consent", "consent"],
];

// Reads ?service= and ?category= from the URL so links can open the form prefilled.
// Unknown values are ignored. A category that doesn't belong to the service is dropped.
function getInitialValues(searchParams) {
  const serviceParam = searchParams.get("service") ?? "";
  const category = getCategoryBySlug(searchParams.get("category") ?? "");

  let service = getServiceBySlug(serviceParam) ? serviceParam : "";
  let categorySlug = "";

  if (category) {
    if (!service) service = category.service; // the category tells us the service
    if (category.service === service) categorySlug = category.slug;
  }

  return {
    name: "",
    phone: "",
    email: "",
    contactMethod: "",
    service,
    category: categorySlug,
    location: "",
    description: "",
    photos: [],
    consent: false,
  };
}

// Checks every field and returns an object of error messages (empty = all good).
// The real backend must run its own checks too. This is only for quick feedback.
function validate(values) {
  const errors = {};

  const name = values.name.trim();
  if (!name) errors.name = "Please enter your name.";
  else if (name.length < 2)
    errors.name = "Your name must be at least 2 characters.";
  else if (name.length > 80)
    errors.name = "Your name must be 80 characters or fewer.";

  // Allow spaces, dashes and brackets while typing; then count the real digits.
  const phone = values.phone.replace(/[\s\-()]/g, "");
  if (!phone) errors.phone = "Please enter a phone number.";
  else if (!/^\+?\d{7,15}$/.test(phone)) {
    errors.phone =
      "Please enter a valid phone number, for example +234 800 000 0000.";
  }

  const email = values.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  } else if (!email && values.contactMethod === "email") {
    errors.email =
      "Please enter your email address, since you chose email as your preferred way to be contacted.";
  }

  if (!values.contactMethod)
    errors.contactMethod = "Please choose how you would like to be contacted.";

  if (!values.service) errors.service = "Please choose a service.";

  const location = values.location.trim();
  if (!location)
    errors.location = "Please tell us where the work would be done.";
  else if (location.length < 2) errors.location = "Please enter a location.";

  const description = values.description.trim();
  if (!description) errors.description = "Please describe your project.";
  else if (description.length < 20)
    errors.description = "Please write at least 20 characters.";

  if (values.photos.length > MAX_PHOTOS) {
    errors.photos = `Please choose no more than ${MAX_PHOTOS} images.`;
  } else {
    const badType = values.photos.find(
      (file) => !ALLOWED_PHOTO_TYPES.includes(file.type),
    );
    const tooBig = values.photos.find((file) => file.size > MAX_PHOTO_BYTES);
    if (badType)
      errors.photos = `"${badType.name}" is not a JPG, PNG or WebP image.`;
    else if (tooBig)
      errors.photos = `"${tooBig.name}" is larger than 5 MB. Please choose a smaller one.`;
  }

  if (!values.consent)
    errors.consent =
      "Please tick the box so we can contact you about this enquiry.";

  return errors;
}

// A short WhatsApp message built from what the visitor has chosen so far.
function buildWhatsAppMessage(values) {
  const service = getServiceBySlug(values.service);
  const category = getCategoryBySlug(values.category);
  if (service && category) {
    return `Hello ELITE, I would like a quote for ${category.name} (${service.name}).`;
  }
  if (service) return `Hello ELITE, I would like a quote for ${service.name}.`;
  return undefined; // uses the default message
}

export default function QuoteForm() {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState(() => getInitialValues(searchParams));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | error | success
  const [fileInputKey, setFileInputKey] = useState(0); // changing it empties the file input

  const timerRef = useRef(null);
  const successRef = useRef(null);

  // Dev only: add ?state=error to the URL to preview the error message.
  const simulateError =
    import.meta.env.DEV && searchParams.get("state") === "error";

  const categoryOptions = values.service
    ? getCategoriesByService(values.service)
    : [];

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  // Updates one field and clears that field's error message.
  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  // Changing the service also clears the category (it belongs to the old service).
  function handleServiceChange(value) {
    setValues((current) => ({ ...current, service: value, category: "" }));
    setErrors((current) => ({
      ...current,
      service: undefined,
      category: undefined,
    }));
  }

  function handlePhotosChange(event) {
    setField("photos", Array.from(event.target.files));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (status === "submitting") return;

    const found = validate(values);
    setErrors(found);

    const firstProblem = FOCUS_ORDER.find(([key]) => found[key]);
    if (firstProblem) {
      document.getElementById(firstProblem[1])?.focus();
      return;
    }

    // PROTOTYPE: nothing is sent anywhere. We only pretend to wait.
    setStatus("submitting");
    timerRef.current = setTimeout(() => {
      setStatus(simulateError ? "error" : "success");
    }, 1200);
  }

  function handleReset() {
    setValues(getInitialValues(new URLSearchParams()));
    setErrors({});
    setFileInputKey((key) => key + 1);
    setStatus("idle");
  }

  const whatsappLink = getWhatsAppLink(buildWhatsAppMessage(values));

  // ---------- Success screen ----------
  if (status === "success") {
    return (
      <div className="border border-obsidian/20 p-8 md:p-10">
        <h2
          ref={successRef}
          tabIndex={-1}
          className="text-3xl font-medium focus:outline-none"
        >
          Thank you. This is a prototype.
        </h2>
        <p className="mt-4 text-obsidian/85">
          Your enquiry has <strong>not</strong> been sent or saved anywhere,
          because the website is not connected to a backend yet. Once it is,
          your request will reach the owner, who will respond using your
          preferred contact method.
        </p>
        <p className="mt-4 text-obsidian/85">
          Want to reach us right now? You can message us directly on WhatsApp.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            WhatsApp us
          </a>
          <button type="button" onClick={handleReset} className="btn-outline">
            Start another enquiry
          </button>
          <Link to="/gallery" className="btn-outline">
            Back to the gallery
          </Link>
        </div>
      </div>
    );
  }

  // ---------- The form ----------
  return (
    // noValidate turns off the browser's own pop-up messages so ours are shown instead
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <p className="text-sm text-obsidian/75">
        We only ask for what we need to reply. All fields are required unless
        marked optional.
      </p>

      <div className="grid gap-8 sm:grid-cols-2">
        <FormField id="name" label="Your name" error={errors.name}>
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              autoComplete="name"
              maxLength={80}
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
            />
          )}
        </FormField>

        <FormField id="phone" label="Phone number" error={errors.phone}>
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(event) => setField("phone", event.target.value)}
            />
          )}
        </FormField>
      </div>

      <FormField
        id="email"
        label="Email address"
        required={false}
        error={errors.email}
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setField("email", event.target.value)}
          />
        )}
      </FormField>

      {/* Preferred contact method: a group of radio buttons */}
      <fieldset
        aria-describedby={
          errors.contactMethod ? "contactMethod-error" : undefined
        }
        aria-invalid={errors.contactMethod ? true : undefined}
      >
        <legend className="mb-3 text-sm font-semibold">
          Preferred way to be contacted
        </legend>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {contactMethods.map((method) => (
            <div key={method.value} className="flex items-center gap-3">
              <input
                type="radio"
                id={`contactMethod-${method.value}`}
                name="contactMethod"
                value={method.value}
                checked={values.contactMethod === method.value}
                onChange={() => setField("contactMethod", method.value)}
                className="h-5 w-5 accent-obsidian"
              />
              <label
                htmlFor={`contactMethod-${method.value}`}
                className="min-h-6 text-base"
              >
                {method.label}
              </label>
            </div>
          ))}
        </div>
        {errors.contactMethod && (
          <FieldError id="contactMethod-error">
            {errors.contactMethod}
          </FieldError>
        )}
      </fieldset>

      <div className="grid gap-8 sm:grid-cols-2">
        <FormField id="service" label="Service" error={errors.service}>
          {(fieldProps) => (
            <select
              {...fieldProps}
              value={values.service}
              onChange={(event) => handleServiceChange(event.target.value)}
            >
              <option value="">Choose a service</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          id="category"
          label="Project category"
          required={false}
          error={errors.category}
        >
          {(fieldProps) => (
            <select
              {...fieldProps}
              disabled={!values.service}
              value={values.category}
              onChange={(event) => setField("category", event.target.value)}
            >
              <option value="">
                {values.service
                  ? "Not sure yet / something else"
                  : "Choose a service first"}
              </option>
              {categoryOptions.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <FormField
        id="location"
        label="Project location or general area"
        error={errors.location}
        hint="A town or area is enough. We do not need your full address."
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="text"
            maxLength={120}
            value={values.location}
            onChange={(event) => setField("location", event.target.value)}
          />
        )}
      </FormField>

      <FormField
        id="description"
        label="Tell us about your project"
        error={errors.description}
        hint="What would you like made or installed? Sizes, materials and style ideas help if you have them."
      >
        {(fieldProps) => (
          <>
            <textarea
              {...fieldProps}
              rows={6}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={values.description}
              onChange={(event) => setField("description", event.target.value)}
            />
            <p className="mt-1 text-right text-xs text-obsidian/70">
              {values.description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </>
        )}
      </FormField>

      <div>
        <FormField
          id="photos"
          label="Reference images"
          required={false}
          error={errors.photos}
          hint={`Photos of the space or styles you like. Up to ${MAX_PHOTOS} images (JPG, PNG or WebP), 5 MB each.`}
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              key={fileInputKey}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotosChange}
              className={`${inputClass(Boolean(errors.photos))} file:mr-4 file:border-0 file:bg-obsidian file:px-4 file:py-2 file:text-sm file:text-ivory`}
            />
          )}
        </FormField>

        {values.photos.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-obsidian/80">
            {values.photos.map((file, index) => (
              <li key={`${file.name}-${index}`}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={values.consent}
            onChange={(event) => setField("consent", event.target.checked)}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            aria-invalid={errors.consent ? true : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-obsidian"
          />
          <label htmlFor="consent" className="text-sm">
            I agree that ELITE may use the information I have provided to
            respond to this enquiry.
          </label>
        </div>
        {errors.consent && (
          <FieldError id="consent-error">{errors.consent}</FieldError>
        )}
      </div>

      {status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-800 p-4 text-sm"
        >
          <CircleAlert
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-red-800"
          />
          <p>
            We could not send your enquiry. Please check your connection and try
            again, or contact us directly by phone or WhatsApp.
          </p>
        </div>
      )}

      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={status === "submitting"}
            aria-busy={status === "submitting"}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "submitting" ? (
              <>
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="animate-spin"
                />
                Sending...
              </>
            ) : (
              "Send enquiry"
            )}
          </button>

          {/* Direct option, prefilled from the service and category chosen above */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Or message us on WhatsApp instead
          </a>
        </div>
        <p className="mt-4 text-sm text-obsidian/75">
          Prototype: sending does not submit or save anything yet.
        </p>
      </div>
    </form>
  );
}
