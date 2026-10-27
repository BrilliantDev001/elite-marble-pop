import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Eye, EyeOff, LoaderCircle } from "lucide-react";
import FormField, { FieldError } from "../shared/FormField";
import { inputClass } from "../shared/formStyles";
import SiteImage from "../shared/SiteImage";
import LoadError from "../shared/LoadError";
import useApi from "../../hooks/useApi";
import usePageMeta from "../../hooks/usePageMeta";
import { apiRequest } from "../../services/api";
import { toImage } from "../../services/mappers";
import { checkPhotoFile, uploadPhoto } from "../../services/uploads";
import { services, getServiceBySlug } from "../../data/services";
import { slugify } from "../../utils/text";

const MAX_PHOTOS = 20; // cover + extra photos, the same limit as the server
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (not public)" },
  { value: "published", label: "Published (visible on the website)" },
  { value: "archived", label: "Archived (hidden, kept for records)" },
];

// The server names photo errors "coverImage.url", "images.0.alt" and so on. The cover is photo 1.
// photoErrorKey(0, "alt") -> "coverImage.alt";  photoErrorKey(2, "url") -> "images.1.url"
function photoErrorKey(index, part) {
  return index === 0 ? `coverImage.${part}` : `images.${index - 1}.${part}`;
}

// Works out which field to focus first, for both browser-side and server-side messages.
function firstProblemId(errors, photos) {
  const fields = [
    ["title", "title"],
    ["slug", "slug"],
    ["service", "service"],
    ["category", "category"],
    ["description", "description"],
    ["details", "details"],
    ["location", "location"],
    ["photos", "photo-input"],
    ["images", "photo-input"],
    ["isSample", "mark-real"],
    ["status", "status"],
  ];
  for (const [key, id] of fields) if (errors[key]) return id;

  for (let index = 0; index < photos.length; index += 1) {
    if (errors[photoErrorKey(index, "alt")]) return `alt-${photos[index].key}`;
    if (errors[photoErrorKey(index, "url")])
      return `remove-${photos[index].key}`;
  }
  return null;
}

// Quick checks in the browser. The server checks everything again.
function validate(values, photos) {
  const errors = {};

  const title = values.title.trim();
  if (!title) errors.title = "Please enter a project title.";
  else if (title.length < 3)
    errors.title = "The title must be at least 3 characters.";
  else if (title.length > 100)
    errors.title = "The title must be 100 characters or fewer.";

  const slug = values.slug.trim();
  if (slug && !SLUG_PATTERN.test(slug)) {
    errors.slug =
      "Use only lowercase letters, numbers and single dashes, for example marble-kitchen-island.";
  } else if (slug === "options") {
    errors.slug =
      "This web address is reserved. Please choose a different one.";
  }

  if (!values.service) errors.service = "Please choose Marble or POP.";
  if (!values.category) errors.category = "Please choose a category.";

  if (photos.length === 0)
    errors.photos =
      "Please add at least one photo. The first photo is the cover.";
  else if (photos.some((photo) => photo.state === "uploading")) {
    errors.photos = "Please wait until all photos have finished uploading.";
  }

  photos.forEach((photo, index) => {
    if (photo.state === "ready" && !photo.alt.trim()) {
      errors[photoErrorKey(index, "alt")] =
        `Please describe photo ${index + 1} for people who cannot see it.`;
    }
  });

  return errors;
}

// ---------- Wrapper: loads the project (when editing) and the categories ----------
export default function AdminProjectForm() {
  const { id } = useParams(); // undefined on /admin/projects/new
  const isEditing = Boolean(id);

  const projectRequest = useApi(isEditing ? `/api/admin/projects/${id}` : null);
  const categoriesRequest = useApi("/api/admin/categories");

  usePageMeta(isEditing ? "Admin: Edit project" : "Admin: Add project");

  if (
    isEditing &&
    projectRequest.status === "error" &&
    projectRequest.error?.status === 404
  ) {
    return (
      <div>
        <h1 className="text-4xl font-medium md:text-5xl">Project not found</h1>
        <p className="mt-3 text-obsidian/80">This project does not exist.</p>
        <Link to="/admin/projects" className="btn-outline mt-8">
          Back to projects
        </Link>
      </div>
    );
  }

  if (
    projectRequest.status === "error" ||
    categoriesRequest.status === "error"
  ) {
    return (
      <LoadError
        message="We could not load this page."
        onRetry={() => {
          projectRequest.reload();
          categoriesRequest.reload();
        }}
      />
    );
  }

  if (
    projectRequest.status === "loading" ||
    categoriesRequest.status === "loading"
  ) {
    return (
      <p role="status" className="text-obsidian/80">
        Loading...
      </p>
    );
  }

  // "key" makes React start with a fresh form whenever the project changes.
  return (
    <ProjectFormBody
      key={id ?? "new"}
      existing={projectRequest.data?.project ?? null}
      categories={categoriesRequest.data.items}
    />
  );
}

// ---------- The form itself ----------
function ProjectFormBody({ existing, categories }) {
  const navigate = useNavigate();
  const isEditing = Boolean(existing);

  const [values, setValues] = useState(() => ({
    title: existing?.title ?? "",
    slug: existing?.slug ?? "",
    service: existing?.service ?? "",
    category: existing?.category ?? "",
    description: existing?.description ?? "",
    details: existing?.details ?? "",
    location: existing?.location ?? "",
    featured: existing?.featured ?? false,
    status: existing?.status ?? "draft",
  }));

  // All photos in one list. The FIRST photo is the cover. Each item:
  //   { key, state: "ready" | "uploading", url, fileId, alt, caption, name }
  const [photos, setPhotos] = useState(() =>
    existing
      ? [existing.coverImage, ...existing.images].map((photo, index) => ({
          key: `saved-${index}`,
          state: "ready",
          url: photo.url,
          fileId: photo.fileId ?? "",
          alt: photo.alt,
          caption: photo.caption ?? "",
          name: "",
        }))
      : [],
  );

  // Once the web address has been typed by hand (or the project already exists), we stop
  // rewriting it from the title. An existing project keeps its address unless changed on purpose.
  const [slugEdited, setSlugEdited] = useState(isEditing);
  const [markReal, setMarkReal] = useState(false); // for sample projects: "this is now a real project"
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [fileProblems, setFileProblems] = useState([]);
  const [photoMessage, setPhotoMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pendingFocus = useRef(null);
  const photoMessageRef = useRef(null);

  const service = getServiceBySlug(values.service);
  const uploadingCount = photos.filter(
    (photo) => photo.state === "uploading",
  ).length;

  // The categories for the chosen service. The project's current category is kept in the list
  // even if it has been archived, so editing never silently breaks it.
  const categoryOptions = categories.filter(
    (category) =>
      category.service === values.service &&
      (category.active || category.slug === existing?.category),
  );
  const selectedCategory = categories.find(
    (category) => category.slug === values.category,
  );

  // After moving a photo, put focus back on the same kind of button for that photo.
  useEffect(() => {
    if (!pendingFocus.current) return;
    const wanted = pendingFocus.current;
    const other = wanted.endsWith("-up")
      ? wanted.replace(/-up$/, "-down")
      : wanted.replace(/-down$/, "-up");
    const button = document.getElementById(wanted);
    const fallback = document.getElementById(other);
    (button && !button.disabled ? button : fallback)?.focus();
    pendingFocus.current = null;
  }, [photos]);

  // Updates one field and clears that field's error message.
  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError("");
  }

  function handleTitleChange(value) {
    setField("title", value);
    if (!slugEdited) setField("slug", slugify(value));
  }

  function handleSlugChange(value) {
    setSlugEdited(true);
    setField("slug", value.toLowerCase().replace(/\s+/g, "-"));
  }

  // Changing the service clears the category (it belonged to the old service).
  function handleServiceChange(value) {
    setValues((current) => ({ ...current, service: value, category: "" }));
    setErrors((current) => ({
      ...current,
      service: undefined,
      category: undefined,
    }));
  }

  // ---------- Photos ----------
  async function handleFilesChange(event) {
    const files = Array.from(event.target.files);
    event.target.value = ""; // lets the same file be chosen again later
    if (files.length === 0) return;

    const problems = [];
    const accepted = [];
    let room = MAX_PHOTOS - photos.length;

    for (const file of files) {
      const problem = checkPhotoFile(file);
      if (problem) problems.push(problem);
      else if (room <= 0)
        problems.push(
          `"${file.name}" was not added: a project can have up to ${MAX_PHOTOS} photos.`,
        );
      else {
        accepted.push({ file, key: `new-${Date.now()}-${accepted.length}` });
        room -= 1;
      }
    }

    setFileProblems(problems);
    if (accepted.length === 0) return;

    // Show a row for each photo straight away, then upload them one after another.
    setPhotos((current) => [
      ...current,
      ...accepted.map(({ file, key }) => ({
        key,
        state: "uploading",
        url: "",
        fileId: "",
        alt: "",
        caption: "",
        name: file.name,
      })),
    ]);
    setErrors((current) => ({
      ...current,
      photos: undefined,
      images: undefined,
    }));
    setFormError("");
    setPhotoMessage(
      `Uploading ${accepted.length} ${accepted.length === 1 ? "photo" : "photos"}...`,
    );

    let uploaded = 0;
    const failed = [];

    for (const { file, key } of accepted) {
      try {
        const result = await uploadPhoto(file, "project");
        setPhotos((current) =>
          current.map((photo) =>
            photo.key === key
              ? {
                  ...photo,
                  state: "ready",
                  url: result.url,
                  fileId: result.fileId,
                }
              : photo,
          ),
        );
        uploaded += 1;
      } catch (error) {
        setPhotos((current) => current.filter((photo) => photo.key !== key));
        failed.push(`"${file.name}": ${error.message}`);
      }
    }

    if (failed.length > 0)
      setFileProblems((current) => [...current, ...failed]);
    setPhotoMessage(
      uploaded > 0
        ? `Uploaded ${uploaded} ${uploaded === 1 ? "photo" : "photos"}. Please describe each one below.`
        : "No photos were uploaded.",
    );
  }

  function updatePhoto(index, changes) {
    setPhotos((current) =>
      current.map((photo, position) =>
        position === index ? { ...photo, ...changes } : photo,
      ),
    );
    if (changes.alt !== undefined) {
      setErrors((current) => ({
        ...current,
        [photoErrorKey(index, "alt")]: undefined,
      }));
    }
  }

  function movePhoto(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next);
    setErrors((current) => ({ ...current, photos: undefined }));
    pendingFocus.current = `photo-${next[target].key}-${direction === -1 ? "up" : "down"}`;
    setPhotoMessage(
      target === 0
        ? "Moved to position 1. This is now the cover photo."
        : `Moved to position ${target + 1}.`,
    );
  }

  function makeCover(index) {
    const next = [
      photos[index],
      ...photos.filter((_, position) => position !== index),
    ];
    setPhotos(next);
    pendingFocus.current = `photo-${next[0].key}-down`;
    setPhotoMessage("This is now the cover photo.");
  }

  function removePhoto(index) {
    setPhotos(photos.filter((_, position) => position !== index));
    setPhotoMessage(`Removed photo ${index + 1}.`);
    photoMessageRef.current?.focus(); // the button we were on has gone, so focus the message
  }

  // ---------- Saving ----------
  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const found = validate(values, photos);
    setErrors(found);
    setFormError("");

    const problemId = firstProblemId(found, photos);
    if (problemId) {
      document.getElementById(problemId)?.focus();
      return;
    }

    const cleanPhotos = photos.map((photo) => ({
      url: photo.url,
      fileId: photo.fileId,
      alt: photo.alt.trim(),
      caption: photo.caption.trim(),
    }));

    let path = "/api/admin/projects";
    let method = "POST";
    let body;

    if (!isEditing) {
      body = {
        title: values.title.trim(),
        service: values.service,
        category: values.category,
        description: values.description.trim(),
        details: values.details.trim(),
        location: values.location.trim(),
        coverImage: cleanPhotos[0],
        images: cleanPhotos.slice(1),
        featured: values.featured,
        status: values.status,
      };
      // Left out when empty, so the server makes the address from the title.
      if (values.slug.trim()) body.slug = values.slug.trim();
    } else {
      // Send only what changed.
      const changes = {};
      const text = {
        title: values.title.trim(),
        description: values.description.trim(),
        details: values.details.trim(),
        location: values.location.trim(),
      };
      if (text.title !== existing.title) changes.title = text.title;
      if (values.slug.trim() && values.slug.trim() !== existing.slug)
        changes.slug = values.slug.trim();
      if (values.service !== existing.service) changes.service = values.service;
      if (values.category !== existing.category)
        changes.category = values.category;
      if (text.description !== (existing.description ?? ""))
        changes.description = text.description;
      if (text.details !== (existing.details ?? ""))
        changes.details = text.details;
      if (text.location !== (existing.location ?? ""))
        changes.location = text.location;
      if (values.featured !== existing.featured)
        changes.featured = values.featured;
      if (values.status !== existing.status) changes.status = values.status;
      if (existing.isSample && markReal) changes.isSample = false;

      // Photos: if anything about them changed (a new photo, the order, alt text or captions),
      // send the whole set. The server checks only the photos that are new.
      const savedPhotos = [existing.coverImage, ...existing.images].map(
        (photo) => ({
          url: photo.url,
          fileId: photo.fileId ?? "",
          alt: photo.alt,
          caption: photo.caption ?? "",
        }),
      );
      if (JSON.stringify(cleanPhotos) !== JSON.stringify(savedPhotos)) {
        changes.coverImage = cleanPhotos[0];
        changes.images = cleanPhotos.slice(1);
      }

      if (Object.keys(changes).length === 0) {
        setFormError("Nothing has changed yet.");
        return;
      }
      path = `/api/admin/projects/${existing.id}`;
      method = "PATCH";
      body = changes;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest(path, { method, body });
      const saved = data.project;
      navigate("/admin/projects", {
        state: {
          message: isEditing
            ? `Saved changes to "${saved.title}" (${saved.status}).`
            : `Created "${saved.title}" as ${saved.status}.`,
        },
      });
    } catch (error) {
      setSubmitting(false);

      // The server found problems with specific fields: show them there.
      const serverErrors = error.fields ?? {};
      const problemId = firstProblemId(serverErrors, photos);
      if (problemId) {
        setErrors(serverErrors);
        document.getElementById(problemId)?.focus();
      } else {
        setFormError(error.message);
      }
    }
  }

  const iconButton =
    "inline-flex h-11 w-11 items-center justify-center border border-obsidian/40 transition-colors hover:bg-obsidian hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-obsidian";
  const firstReady = photos.find((photo) => photo.state === "ready");

  return (
    <div>
      <Link
        to="/admin/projects"
        className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
      >
        Back to projects
      </Link>

      <h1 className="mt-2 text-4xl font-medium md:text-5xl">
        {isEditing ? "Edit project" : "Add project"}
      </h1>
      <p className="mt-3 max-w-2xl text-obsidian/80">
        You only need a title, a service, a category and one photo. Everything
        else is optional.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-10 max-w-3xl space-y-12"
      >
        {/* ---------- Details ---------- */}
        <section className="space-y-8">
          <h2 className="text-3xl font-medium">Details</h2>

          <FormField id="title" label="Project title" error={errors.title}>
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="text"
                maxLength={100}
                value={values.title}
                onChange={(event) => handleTitleChange(event.target.value)}
              />
            )}
          </FormField>

          <FormField
            id="slug"
            label="Web address ending"
            required={false}
            error={errors.slug}
            hint={`The project page will be at /gallery/${values.slug || "your-address"}. It is made from the title, but you can change it.${
              isEditing && existing.status === "published"
                ? " This project is published, so changing its address breaks any links already shared."
                : ""
            }`}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="text"
                value={values.slug}
                onChange={(event) => handleSlugChange(event.target.value)}
              />
            )}
          </FormField>

          <div className="grid gap-8 sm:grid-cols-2">
            <FormField id="service" label="Service" error={errors.service}>
              {(fieldProps) => (
                <select
                  {...fieldProps}
                  value={values.service}
                  onChange={(event) => handleServiceChange(event.target.value)}
                >
                  <option value="">Choose a service</option>
                  {services.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField id="category" label="Category" error={errors.category}>
              {(fieldProps) => (
                <select
                  {...fieldProps}
                  disabled={!values.service}
                  value={values.category}
                  onChange={(event) => setField("category", event.target.value)}
                >
                  <option value="">
                    {values.service
                      ? "Choose a category"
                      : "Choose a service first"}
                  </option>
                  {categoryOptions.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                      {!item.active && " (archived)"}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>

          <FormField
            id="description"
            label="Short description"
            required={false}
            error={errors.description}
          >
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                rows={3}
                maxLength={300}
                value={values.description}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
              />
            )}
          </FormField>

          <FormField
            id="details"
            label="More details"
            required={false}
            error={errors.details}
          >
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                rows={4}
                maxLength={1000}
                value={values.details}
                onChange={(event) => setField("details", event.target.value)}
              />
            )}
          </FormField>

          <FormField
            id="location"
            label="Location"
            required={false}
            error={errors.location}
            hint="Only add this if the customer has agreed to it being shown publicly. Leave it empty otherwise."
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
        </section>

        {/* ---------- Photos ---------- */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium">Photos</h2>

          <FormField
            id="photo-input"
            label="Add photos"
            error={errors.photos ?? errors.images}
            hint={`Choose several at once. JPG, PNG or WebP, up to 5 MB each, up to ${MAX_PHOTOS} photos. Each photo is uploaded as soon as you choose it. The first photo is the cover.`}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFilesChange}
                className={`${inputClass(Boolean(errors.photos ?? errors.images))} file:mr-4 file:border-0 file:bg-obsidian file:px-4 file:py-2 file:text-sm file:text-ivory`}
              />
            )}
          </FormField>

          {fileProblems.length > 0 && (
            <div role="alert">
              {fileProblems.map((problem) => (
                <FieldError key={problem}>{problem}</FieldError>
              ))}
            </div>
          )}

          <p
            ref={photoMessageRef}
            role="status"
            tabIndex={-1}
            className={`border-l-2 border-gold pl-4 text-sm focus:outline-none ${photoMessage ? "" : "sr-only"}`}
          >
            {photoMessage}
          </p>

          {photos.length > 0 ? (
            <ol className="space-y-5">
              {photos.map((photo, index) => (
                <li key={photo.key} className="border border-obsidian/25 p-4">
                  {photo.state === "uploading" ? (
                    <p
                      role="status"
                      className="flex items-center gap-3 text-sm"
                    >
                      <LoaderCircle
                        size={18}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                      Uploading {photo.name}...
                    </p>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <SiteImage
                        image={toImage({
                          url: photo.url,
                          alt: photo.alt || `Preview of photo ${index + 1}`,
                        })}
                        className="h-40 w-full shrink-0 sm:h-32 sm:w-44"
                        sizes="176px"
                      />

                      <div className="min-w-0 flex-1 space-y-4">
                        <p className="text-sm font-semibold">
                          {index === 0
                            ? "Photo 1 (cover)"
                            : `Photo ${index + 1}`}
                        </p>

                        <FormField
                          id={`alt-${photo.key}`}
                          label={`Alt text for photo ${index + 1}`}
                          error={errors[photoErrorKey(index, "alt")]}
                          hint="Describe what the photo shows, for people who cannot see it."
                        >
                          {(fieldProps) => (
                            <input
                              {...fieldProps}
                              type="text"
                              maxLength={200}
                              value={photo.alt}
                              onChange={(event) =>
                                updatePhoto(index, { alt: event.target.value })
                              }
                            />
                          )}
                        </FormField>

                        <FormField
                          id={`caption-${photo.key}`}
                          label={`Caption for photo ${index + 1}`}
                          required={false}
                          error={errors[photoErrorKey(index, "caption")]}
                        >
                          {(fieldProps) => (
                            <input
                              {...fieldProps}
                              type="text"
                              maxLength={150}
                              value={photo.caption}
                              onChange={(event) =>
                                updatePhoto(index, {
                                  caption: event.target.value,
                                })
                              }
                            />
                          )}
                        </FormField>

                        {errors[photoErrorKey(index, "url")] && (
                          <FieldError>
                            {errors[photoErrorKey(index, "url")]}
                          </FieldError>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            id={`photo-${photo.key}-up`}
                            disabled={index === 0}
                            onClick={() => movePhoto(index, -1)}
                            aria-label={`Move photo ${index + 1} up`}
                            className={iconButton}
                          >
                            <ArrowUp size={18} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            id={`photo-${photo.key}-down`}
                            disabled={index === photos.length - 1}
                            onClick={() => movePhoto(index, 1)}
                            aria-label={`Move photo ${index + 1} down`}
                            className={iconButton}
                          >
                            <ArrowDown size={18} aria-hidden="true" />
                          </button>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => makeCover(index)}
                              aria-label={`Make photo ${index + 1} the cover photo`}
                              className="btn-outline btn-sm"
                            >
                              Make cover
                            </button>
                          )}
                          <button
                            type="button"
                            id={`remove-${photo.key}`}
                            onClick={() => removePhoto(index)}
                            aria-label={`Remove photo ${index + 1}`}
                            className="btn-outline btn-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="border border-obsidian/20 p-6 text-obsidian/80">
              No photos added yet.
            </p>
          )}
        </section>

        {/* ---------- Publishing ---------- */}
        <section className="space-y-8">
          <h2 className="text-3xl font-medium">Publishing</h2>

          <FormField
            id="status"
            label="Status"
            error={errors.status}
            hint="Only published projects appear on the public website."
          >
            {(fieldProps) => (
              <select
                {...fieldProps}
                value={values.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={values.featured}
              onChange={(event) => setField("featured", event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-obsidian"
            />
            <label htmlFor="featured" className="text-sm">
              Feature this project on the home page. Only published projects are
              shown there.
            </label>
          </div>
        </section>

        {/* ---------- A sample project: turning it into a real one ---------- */}
        {isEditing && existing.isSample && (
          <section className="space-y-4 border border-obsidian/25 p-6">
            <h2 className="text-3xl font-medium">Sample project</h2>
            <p className="text-sm text-obsidian/85">
              This is a sample project, so the website labels it "Sample project, not real ELITE work".
              Edit the title, text, category and photos so it describes real work. When it does, tick the
              box below to remove the label. This is only possible once every placeholder photo has
              been replaced with a real one.
            </p>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="mark-real"
                checked={markReal}
                onChange={(event) => {
                  setMarkReal(event.target.checked);
                  setErrors((current) => ({ ...current, isSample: undefined }));
                }}
                aria-describedby={errors.isSample ? "mark-real-error" : undefined}
                aria-invalid={errors.isSample ? true : undefined}
                className="mt-1 h-5 w-5 shrink-0 accent-obsidian"
              />
              <label htmlFor="mark-real" className="text-sm">
                This is now a real project. Remove the "sample" label.
              </label>
            </div>
            {errors.isSample && <FieldError id="mark-real-error">{errors.isSample}</FieldError>}
          </section>
        )}

        {/* ---------- Preview ---------- */}
        <section>
          <button
            type="button"
            onClick={() => setShowPreview((value) => !value)}
            aria-expanded={showPreview}
            aria-controls="project-preview"
            className="btn-outline btn-sm"
          >
            {showPreview ? (
              <EyeOff size={14} aria-hidden="true" />
            ) : (
              <Eye size={14} aria-hidden="true" />
            )}
            {showPreview ? "Hide preview" : "Preview before saving"}
          </button>

          {showPreview && (
            <div
              id="project-preview"
              className="mt-6 border border-obsidian/25 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-obsidian/70">
                Preview of the project card (not saved)
              </p>

              <div className="mt-5 max-w-sm">
                {firstReady ? (
                  <SiteImage
                    image={toImage({
                      url: firstReady.url,
                      alt: firstReady.alt || "Preview of the cover photo",
                    })}
                    className="aspect-[4/3]"
                    sizes="384px"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-stone/20 text-sm">
                    No cover photo yet
                  </div>
                )}
                <h3 className="mt-4 text-2xl font-medium">
                  {values.title || "Project title"}
                </h3>
                <p className="mt-1 text-sm text-obsidian/80">
                  {service?.shortName ?? "Service"}
                  {selectedCategory && ` · ${selectedCategory.name}`}
                  {photos.length > 1 && ` · ${photos.length} photos`}
                </p>
                {values.description && (
                  <p className="mt-2 text-sm text-obsidian/85">
                    {values.description}
                  </p>
                )}
              </div>

              <p className="mt-5 text-sm">
                {values.status === "published"
                  ? "Status: Published. Visitors will see this project."
                  : `Status: ${values.status}. Visitors will not see this project.`}
              </p>
            </div>
          )}
        </section>

        {formError && (
          <div role="alert">
            <FieldError>{formError}</FieldError>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-obsidian/20 pt-8 sm:flex-row">
          <button
            type="submit"
            disabled={submitting || uploadingCount > 0}
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
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Create project"
            )}
          </button>
          <Link to="/admin/projects" className="btn-outline">
            Cancel
          </Link>
        </div>
        {uploadingCount > 0 && (
          <p className="text-sm text-obsidian/75">
            Saving is available once all photos have finished uploading.
          </p>
        )}
      </form>
    </div>
  );
}
