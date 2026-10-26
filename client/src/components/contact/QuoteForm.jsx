import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleAlert, LoaderCircle, MessageCircle } from "lucide-react";
import FormField, { FieldError } from "../shared/FormField";
import HoneypotField from "../shared/HoneypotField";
import useApi from "../../hooks/useApi";
import { useSettings } from "../../context/settingsContext";
import { apiRequest } from "../../services/api";
import { services, getServiceBySlug } from "../../data/services";
import { getWhatsAppLink } from "../../data/siteConfig";
import { countLinks } from "../../utils/forms";

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
  ["consent", "consent"],
];

// Reads ?service= and ?category= from the URL so links can open the form prefilled.
// An unknown service is ignored. A category is only used together with a service, and it is
// checked against the real categories once they have loaded.
function getInitialValues(searchParams) {
  const serviceParam = searchParams.get("service") ?? "";
  const service = getServiceBySlug(serviceParam) ? serviceParam : "";

  return {
    name: "",
    phone: "",
    email: "",
    contactMethod: "",
    service,
    category: service ? (searchParams.get("category") ?? "") : "",
    location: "",
    description: "",
    consent: false,
    website: "", // the hidden spam trap. It must stay empty for real visitors.
  };
}

// Quick checks in the browser, for fast feedback. The server checks everything again.
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
  else if (countLinks(description) > 2)
    errors.description = "Please include no more than 2 web links.";

  if (!values.consent)
    errors.consent =
      "Please tick the box so we can contact you about this enquiry.";

  return errors;
}

// A short WhatsApp message built from what the visitor has chosen so far.
function buildWhatsAppMessage(serviceSlug, categoryName) {
  const service = getServiceBySlug(serviceSlug);
  if (service && categoryName)
    return `Hello ELITE, I would like a quote for ${categoryName} (${service.name}).`;
  if (service) return `Hello ELITE, I would like a quote for ${service.name}.`;
  return undefined; // uses the default message
}

export default function QuoteForm() {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState(() => getInitialValues(searchParams));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | error | success
  const [errorMessage, setErrorMessage] = useState("");
  const [thanks, setThanks] = useState("");
  const successRef = useRef(null);

  const { contact } = useSettings();

  // The active categories, loaded once and filtered by the chosen service.
  const categoriesRequest = useApi("/api/categories");
  const categoriesStatus = categoriesRequest.status;
  const categoryOptions = (categoriesRequest.data?.items ?? []).filter(
    (category) => category.service === values.service,
  );

  // A category from the link that does not exist, is archived, or belongs to the other service
  // simply counts as "not chosen". Until the categories have loaded, nothing is sent for it.
  const categoriesReady = categoriesStatus === "ready";
  const category =
    categoriesReady &&
    !categoryOptions.some((option) => option.slug === values.category)
      ? ""
      : values.category;
  const categoryToSend = categoriesReady ? category : "";
  const selectedCategory = categoryOptions.find(
    (option) => option.slug === category,
  );

  // Move focus to the success message so screen reader users hear it.
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

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "submitting") return;

    const found = validate(values);
    setErrors(found);

    const firstProblem = FOCUS_ORDER.find(([key]) => found[key]);
    if (firstProblem) {
      document.getElementById(firstProblem[1])?.focus();
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const data = await apiRequest("/api/enquiries", {
        method: "POST",
        body: {
          name: values.name,
          phone: values.phone,
          email: values.email,
          contactMethod: values.contactMethod,
          service: values.service,
          category: categoryToSend,
          location: values.location,
          description: values.description,
          consent: values.consent,
          website: values.website,
        },
      });
      // We only say "thank you" now, after the server has really confirmed the save.
      setThanks(data.message);
      setStatus("success");
    } catch (error) {
      // The server found problems with specific fields: show them next to the fields.
      const serverErrors = error.fields ?? {};
      const first = FOCUS_ORDER.find(([key]) => serverErrors[key]);

      if (first) {
        setErrors(serverErrors);
        setStatus("idle");
        document.getElementById(first[1])?.focus();
      } else {
        setErrorMessage(error.message);
        setStatus("error");
      }
    }
  }

  function handleReset() {
    setValues(getInitialValues(new URLSearchParams()));
    setErrors({});
    setErrorMessage("");
    setStatus("idle");
  }

  const whatsappLink = contact
    ? getWhatsAppLink(
        buildWhatsAppMessage(values.service, selectedCategory?.name),
        contact,
      )
    : null;

  // What the category menu says when it has no real choices to show.
  let categoryPlaceholder = "Not sure yet / something else";
  if (!values.service) categoryPlaceholder = "Choose a service first";
  else if (categoriesStatus === "loading")
    categoryPlaceholder = "Loading categories...";
  else if (categoriesStatus === "error")
    categoryPlaceholder = "Categories unavailable";

  // ---------- Success screen ----------
  if (status === "success") {
    return (
      <div className="border border-obsidian/20 p-8 md:p-10">
        <h2
          ref={successRef}
          tabIndex={-1}
          className="text-3xl font-medium focus:outline-none"
        >
          Thank you.
        </h2>
        <p className="mt-4 text-obsidian/85">{thanks}</p>
        {whatsappLink && (
          <p className="mt-4 text-obsidian/85">
            Have photos of the space or the style you like? You can send them to
            us on WhatsApp.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Send photos on WhatsApp
            </a>
          )}
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
      <HoneypotField
        value={values.website}
        onChange={(value) => setField("website", value)}
      />

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
          hint={
            categoriesStatus === "error"
              ? "Categories could not be loaded. You can still send your enquiry."
              : undefined
          }
        >
          {(fieldProps) => (
            <select
              {...fieldProps}
              disabled={!values.service || !categoriesReady}
              value={category}
              onChange={(event) => setField("category", event.target.value)}
            >
              <option value="">{categoryPlaceholder}</option>
              {categoryOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
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
        hint="A town or area is enough. Don't bother typing full address yet."
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

      {/* The form is text only. Photos can be sent on WhatsApp instead. */}
      <p className="text-sm text-obsidian/80">
        Have photos of the space or styles you like? You can send them to us on
        WhatsApp after you submit this form.
      </p>

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
            {errorMessage}
            {whatsappLink && " You can also contact us directly on WhatsApp."}
          </p>
        </div>
      )}

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

        {/* A direct option, prefilled from the service and category chosen above */}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Or message us on WhatsApp instead
          </a>
        )}
      </div>
    </form>
  );
}
