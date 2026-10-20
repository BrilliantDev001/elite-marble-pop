// A consistent heading block for page sections: small eyebrow, title, optional intro.
//
// Props:
//   eyebrow      small label above the title (optional)
//   title        the main heading text
//   description  short paragraph under the title (optional)
//   align        "left" (default) or "center"
//   tone         "dark" (default, for light backgrounds) or "light" (for dark backgrounds)
//   as           heading tag: "h2" (default), "h1", "h3"...
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  as: Heading = "h2",
  className = "",
}) {
  const isCenter = align === "center";
  const isLight = tone === "light";

  return (
    <div
      className={`max-w-2xl ${isCenter ? "mx-auto text-center" : ""} ${className}`}
    >
      {eyebrow && (
        <p
          className={`mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] ${
            isCenter ? "justify-center" : ""
          } ${isLight ? "text-gold" : "text-obsidian/70"}`}
        >
          {/* Small gold rule: gold used as a fine detail, not as text on ivory */}
          <span aria-hidden="true" className="h-px w-8 bg-gold" />
          {eyebrow}
        </p>
      )}

      <Heading
        className={`text-4xl font-medium md:text-5xl ${
          isLight ? "text-ivory" : "text-obsidian"
        }`}
      >
        {title}
      </Heading>

      {description && (
        <p
          className={`mt-5 text-base md:text-lg ${
            isLight ? "text-ivory/80" : "text-obsidian/80"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
