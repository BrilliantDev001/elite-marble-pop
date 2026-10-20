import { useEffect } from "react";

const SITE_NAME = "ELITE Marble & POP Works Ltd.";
const DEFAULT_DESCRIPTION =
  "Premium marble installations and bespoke POP designs by ELITE Marble & POP Works Ltd. Browse our work and request a personalized quotation.";

// Call this at the top of a page component:
//   usePageMeta("Gallery", "Browse our marble and POP projects.");
// Leave the title empty on the home page to use the default title.
export default function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    document.title = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} | Premium Interior Finishing`;

    // Find the description tag in index.html (or create it if missing).
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", description);
  }, [title, description]);
}
