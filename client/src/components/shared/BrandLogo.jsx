import { Link } from "react-router-dom";
import { siteConfig } from "../../data/siteConfig";

// Temporary typographic word-mark: ELITE with the descriptor underneath.
// tone="dark"  -> for light backgrounds (dark text)
// tone="light" -> for dark backgrounds (ivory text with gold descriptor)
export default function BrandLogo({ tone = "dark", className = "" }) {
  const isLight = tone === "light";

  return (
    <Link
      to="/"
      aria-label={`${siteConfig.name} ${siteConfig.descriptor}, go to home page`}
      className={`inline-flex flex-col leading-none ${className}`}
    >
      <span
        className={`font-heading text-3xl font-semibold tracking-[0.3em] ${
          isLight ? "text-ivory" : "text-obsidian"
        }`}
      >
        {siteConfig.name}
      </span>
      <span
        className={`mt-1.5 text-[0.6rem] font-semibold tracking-[0.28em] ${
          isLight ? "text-gold" : "text-obsidian/75"
        }`}
      >
        {siteConfig.descriptor}
      </span>
    </Link>
  );
}
