import usePageMeta from "../hooks/usePageMeta";
import HeroCarousel from "../components/home/HeroCarousel";
import SpecialtySelector from "../components/home/SpecialtySelector";

export default function Home() {
  // An empty title uses the default: "ELITE Marble & POP Works Ltd. | Premium Interior Finishing"
  usePageMeta("");

  return (
    <>
      <HeroCarousel />
      <SpecialtySelector />
    </>
  );
}
