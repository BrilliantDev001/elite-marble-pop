import usePageMeta from "../../hooks/usePageMeta";

// TEMPORARY: a simple placeholder shown until each real page is built.
export default function PageStub({
  title,
  note = "This page is under construction.",
}) {
  usePageMeta(title);

  return (
    <section className="container-page py-24">
      <h1 className="text-5xl font-medium">{title}</h1>
      <p className="mt-4 text-obsidian/80">{note}</p>
    </section>
  );
}
