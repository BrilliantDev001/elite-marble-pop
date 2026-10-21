import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import FormField, { FieldError, inputClass } from "../shared/FormField";
import SiteImage from "../shared/SiteImage";
import usePageMeta from "../../hooks/usePageMeta";
import { services, getServiceBySlug } from "../../data/services";
import { getProjectImages } from "../../data/projects";
import { slugify, todayISO } from "../../data/adminMock";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per photo
const MAX_PHOTOS = 20;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (not public)" },
  { value: "published", label: "Published (visible on the website)" },
  { value: "archived", label: "Archived (hidden, kept for records)" },
];

// When the form is submitted with mistakes, focus goes to the FIRST problem field,
// in the same order as the form. Photo description errors are handled after these.
const FOCUS_ORDER = [
  ["title", "title"],
  ["slug", "slug"],
  ["service", "service"],
  ["category", "category"],
  ["photos", "photo-input"],
];

// Checks every field and returns an object of error messages (empty = all good).
// The real backend must run its own checks too. This is only for quick feedback.
function validate({ values, photos, projects, categories, existing }) {
  const errors = { alts: {} };

  const title = values.title.trim();
  if (!title) errors.title = "Please enter a project title.";
  else if (title.length < 3)
    errors.title = "The title must be at least 3 characters.";
  else if (title.length > 100)
    errors.title = "The title must be 100 characters or fewer.";

  const slug = values.slug.trim();
  if (!slug) {
    errors.slug = "The web address cannot be empty.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      "Use only lowercase letters, numbers and single dashes, for example marble-kitchen-island.";
  } else if (
    projects.some(
      (project) => project.slug === slug && project.id !== existing?.id,
    )
  ) {
    errors.slug =
      "Another project already uses this web address. Please change it.";
  }

  if (!values.service) errors.service = "Please choose Marble or POP.";

  if (!values.category) {
    errors.category = "Please choose a category.";
  } else if (
    !categories.some(
      (c) => c.slug === values.category && c.service === values.service,
    )
  ) {
    errors.category =
      "This category does not belong to the chosen service. Please choose again.";
  }

  if (photos.length === 0) {
    errors.photos =
      "Please add at least one photo. The first photo is the cover.";
  }

  photos.forEach((photo, index) => {
    if (!photo.alt.trim()) {
      errors.alts[photo.key] =
        `Please describe photo ${index + 1} for people who cannot see it.`;
    }
  });

  return errors;
}

// ---------- Wrapper: finds the project (when editing) and shows "not found" if needed ----------
export default function AdminProjectForm() {
  const { id } = useParams(); // undefined on /admin/projects/new
  const { projects } = useOutletContext();
  const existing = id ? projects.find((project) => project.id === id) : null;

  usePageMeta(id ? "Admin: Edit project" : "Admin: Add project");

  if (id && !existing) {
    return (
      <div>
        <h1 className="text-4xl font-medium md:text-5xl">Project not found</h1>
        <p className="mt-3 text-obsidian/80">
          This project does not exist in the prototype data.
        </p>
        <Link to="/admin/projects" className="btn-outline mt-8">
          Back to projects
        </Link>
      </div>
    );
  }

  // "key" makes React start with a fresh form whenever the project changes.
  return <ProjectFormBody key={id ?? "new"} existing={existing} />;
}

// ---------- The form itself ----------
function ProjectFormBody({ existing }) {
  const navigate = useNavigate();
  const { projects, setProjects, categories } = useOutletContext();
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

  // All photos in one list. The FIRST photo is the cover.
  // Each item: { key, src, alt, caption, isPlaceholder, fileId? }
  const [photos, setPhotos] = useState(() =>
    existing
      ? getProjectImages(existing).map((image, index) => ({
          ...image,
          key: `existing-${index}`,
        }))
      : [],
  );

  // Once the slug has been typed by hand (or the project already exists),
  // we stop rewriting it from the title. Existing projects keep their web address.
  const [slugEdited, setSlugEdited] = useState(isEditing);
  const [errors, setErrors] = useState({ alts: {} });
  const [fileProblems, setFileProblems] = useState([]);
  const [photoMessage, setPhotoMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const pendingFocus = useRef(null);
  const photoMessageRef = useRef(null);

  const service = getServiceBySlug(values.service);

  // Active categories for the chosen service, plus the project's current category
  // (even if archived) so editing never silently breaks it.
  const categoryOptions = categories.filter(
    (c) =>
      c.service === values.service && (c.active || c.slug === values.category),
  );
  const selectedCategory = categories.find((c) => c.slug === values.category);

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
  function handleFilesChange(event) {
    const files = Array.from(event.target.files);
    event.target.value = ""; // lets the same file be chosen again later

    const problems = [];
    const accepted = [];

    files.forEach((file) => {
      const fileId = `${file.name}-${file.size}`;
      const alreadyAdded =
        photos.some((photo) => photo.fileId === fileId) ||
        accepted.some((photo) => photo.fileId === fileId);

      if (!ALLOWED_TYPES.includes(file.type)) {
        problems.push(`"${file.name}" is not a JPG, PNG or WebP image.`);
      } else if (file.size > MAX_BYTES) {
        problems.push(`"${file.name}" is larger than 5 MB.`);
      } else if (alreadyAdded) {
        problems.push(`"${file.name}" has already been added.`);
      } else {
        accepted.push({
          key: `new-${Date.now()}-${accepted.length}`,
          fileId,
          // PROTOTYPE: a temporary link to the file on this computer. Nothing is uploaded.
          src: URL.createObjectURL(file),
          alt: "",
          caption: "",
          isPlaceholder: false,
        });
      }
    });

    const room = MAX_PHOTOS - photos.length;
    const kept = accepted.slice(0, room);
    accepted.slice(room).forEach((photo) => URL.revokeObjectURL(photo.src));
    if (accepted.length > kept.length) {
      problems.push(
        `A project can have up to ${MAX_PHOTOS} photos. Some were not added.`,
      );
    }

    setFileProblems(problems);
    if (kept.length > 0) {
      setPhotos((current) => [...current, ...kept]);
      setErrors((current) => ({ ...current, photos: undefined }));
      setPhotoMessage(
        `Added ${kept.length} ${kept.length === 1 ? "photo" : "photos"}. Please describe each one below.`,
      );
    }
  }

  function updatePhoto(key, changes) {
    setPhotos((current) =>
      current.map((photo) =>
        photo.key === key ? { ...photo, ...changes } : photo,
      ),
    );
    if (changes.alt !== undefined) {
      setErrors((current) => ({
        ...current,
        alts: { ...current.alts, [key]: undefined },
      }));
    }
  }

  function movePhoto(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next);
    pendingFocus.current = `photo-${next[target].key}-${direction === -1 ? "up" : "down"}`;
    setPhotoMessage(
      target === 0
        ? "Moved to position 1. This is now the cover photo."
        : `Moved to position ${target + 1}.`,
    );
  }

  function makeCover(index) {
    const next = [photos[index], ...photos.filter((_, i) => i !== index)];
    setPhotos(next);
    pendingFocus.current = `photo-${next[0].key}-down`;
    setPhotoMessage("This is now the cover photo.");
  }

  function removePhoto(index) {
    const photo = photos[index];
    if (photo.fileId) URL.revokeObjectURL(photo.src); // only for photos added in this session
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoMessage(`Removed photo ${index + 1}.`);
    photoMessageRef.current?.focus(); // the button we were on has gone, so focus the message
  }

  // ---------- Saving ----------
  function handleSubmit(event) {
    event.preventDefault();

    const found = validate({ values, photos, projects, categories, existing });
    setErrors(found);

    const firstField = FOCUS_ORDER.find(([key]) => found[key]);
    const firstPhoto = photos.find((photo) => found.alts[photo.key]);
    if (firstField) {
      document.getElementById(firstField[1])?.focus();
      return;
    }
    if (firstPhoto) {
      document.getElementById(`alt-${firstPhoto.key}`)?.focus();
      return;
    }

    const cleanPhotos = photos.map((photo) => ({
      src: photo.src,
      alt: photo.alt.trim(),
      caption: photo.caption.trim(),
      isPlaceholder: photo.isPlaceholder,
    }));

    const saved = {
      ...(existing ?? {}),
      id: existing?.id ?? `p${Date.now()}`,
      title: values.title.trim(),
      slug: values.slug.trim(),
      service: values.service,
      category: values.category,
      description: values.description.trim(),
      details: values.details.trim(),
      coverImage: cleanPhotos[0],
      images: cleanPhotos.slice(1),
      location: values.location.trim() || null,
      featured: values.featured,
      status: values.status,
      isSample: existing?.isSample ?? false,
      createdAt: existing?.createdAt ?? todayISO(),
      updatedAt: todayISO(),
    };

    setProjects((current) =>
      isEditing
        ? current.map((project) => (project.id === saved.id ? saved : project))
        : [saved, ...current],
    );

    navigate("/admin/projects", {
      state: {
        message: isEditing
          ? `Saved changes to "${saved.title}" (${saved.status}).`
          : `Created "${saved.title}" as ${saved.status}.`,
      },
    });
  }

  const fileInputClass = `${inputClass(Boolean(errors.photos))} file:mr-4 file:border-0 file:bg-obsidian file:px-4 file:py-2 file:text-sm file:text-ivory`;
  const iconButton =
    "inline-flex h-11 w-11 items-center justify-center border border-obsidian/40 transition-colors hover:bg-obsidian hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-obsidian";

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
            error={errors.slug}
            hint={`The project page will be at /gallery/${values.slug || "your-address"}. It is made from the title, but you can change it. Changing it later breaks any links already shared.`}
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

          <FormField id="details" label="More details" required={false}>
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
            error={errors.photos}
            hint={`Choose several at once. JPG, PNG or WebP, up to 5 MB each, up to ${MAX_PHOTOS} photos. The first photo is the cover.`}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFilesChange}
                className={fileInputClass}
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
            className={`border-l-2 border-gold pl-4 text-sm focus:outline-none ${
              photoMessage ? "" : "sr-only"
            }`}
          >
            {photoMessage}
          </p>

          {photos.length > 0 ? (
            <ol className="space-y-5">
              {photos.map((photo, index) => (
                <li key={photo.key} className="border border-obsidian/25 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <SiteImage
                      image={{
                        ...photo,
                        alt: photo.alt || `Preview of photo ${index + 1}`,
                      }}
                      className="h-40 w-full shrink-0 sm:h-32 sm:w-44"
                      sizes="176px"
                    />

                    <div className="min-w-0 flex-1 space-y-4">
                      <p className="text-sm font-semibold">
                        {index === 0 ? "Photo 1 (cover)" : `Photo ${index + 1}`}
                      </p>

                      <FormField
                        id={`alt-${photo.key}`}
                        label={`Alt text for photo ${index + 1}`}
                        error={errors.alts[photo.key]}
                        hint="Describe what the photo shows, for people who cannot see it."
                      >
                        {(fieldProps) => (
                          <input
                            {...fieldProps}
                            type="text"
                            maxLength={200}
                            value={photo.alt}
                            onChange={(event) =>
                              updatePhoto(photo.key, {
                                alt: event.target.value,
                              })
                            }
                          />
                        )}
                      </FormField>

                      <FormField
                        id={`caption-${photo.key}`}
                        label={`Caption for photo ${index + 1}`}
                        required={false}
                      >
                        {(fieldProps) => (
                          <input
                            {...fieldProps}
                            type="text"
                            maxLength={150}
                            value={photo.caption}
                            onChange={(event) =>
                              updatePhoto(photo.key, {
                                caption: event.target.value,
                              })
                            }
                          />
                        )}
                      </FormField>

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
                          onClick={() => removePhoto(index)}
                          aria-label={`Remove photo ${index + 1}`}
                          className="btn-outline btn-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
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
                {photos[0] ? (
                  <SiteImage
                    image={{
                      ...photos[0],
                      alt: photos[0].alt || "Preview of the cover photo",
                    }}
                    className="aspect-[4/3]"
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

        <div className="flex flex-col gap-4 border-t border-obsidian/20 pt-8 sm:flex-row">
          <button type="submit" className="btn-primary">
            {isEditing ? "Save changes" : "Create project"}
          </button>
          <Link to="/admin/projects" className="btn-outline">
            Cancel
          </Link>
        </div>
        <p className="text-sm text-obsidian/70">
          Prototype: saving only changes the mock data for this session. No
          photo is uploaded.
        </p>
      </form>
    </div>
  );
}
