import { Ruler, Hammer, Sparkles, ClipboardList } from "lucide-react";
import SectionHeading from "../shared/SectionHeading";

// These are values, not claims about years, awards or customer numbers.
// The owner should confirm the wording before launch.
const reasons = [
  {
    icon: Ruler,
    title: "Attention to detail",
    text: "Measurements, cuts and joins are checked with care so that every surface fits properly and looks clean.",
  },
  {
    icon: Hammer,
    title: "Craftsmanship",
    text: "Each piece is shaped and installed by hand with patience, whether it is stone or plaster.",
  },
  {
    icon: Sparkles,
    title: "Careful finishing",
    text: "The finish is where the work shows. Edges, surfaces and details get the time they need.",
  },
  {
    icon: ClipboardList,
    title: "Personalised quotations",
    text: "No fixed price lists. Each quotation is prepared around your design, space and requirements.",
  },
];

export default function WhyChooseElite() {
  return (
    <section className="border-y border-obsidian/10 py-20 md:py-28">
      <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <SectionHeading
          eyebrow="Why choose ELITE"
          title="Work that is built to look right and last."
          description="What you can expect when you work with us."
        />

        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {reasons.map((reason) => (
            <li key={reason.title} className="border-t border-obsidian/20 pt-6">
              <reason.icon size={26} strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-4 text-2xl font-medium">{reason.title}</h3>
              <p className="mt-2 text-sm text-obsidian/80">{reason.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
