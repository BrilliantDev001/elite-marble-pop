import usePageMeta from "../hooks/usePageMeta";
import HeroCarousel from "../components/home/HeroCarousel";
import SpecialtySelector from "../components/home/SpecialtySelector";
import CategoryPreview from "../components/home/CategoryPreview";
import FeaturedProjects from "../components/home/FeaturedProjects";

export default function Home() {
  // An empty title uses the default: "ELITE Marble & POP Works Ltd. | Premium Interior Finishing"
  usePageMeta("");

  return (
    <>
      <HeroCarousel />
      <SpecialtySelector />
      <CategoryPreview service="marble" />
      <CategoryPreview service="pop" tone="dark" />
      <FeaturedProjects />
    </>
  );
}
