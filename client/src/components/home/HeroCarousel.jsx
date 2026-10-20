import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import SiteImage from "../shared/SiteImage";
import { heroSlides } from "../../data/heroSlides";
import { siteConfig } from "../../data/siteConfig";

const AUTOPLAY_MS = 6500; // time each slide stays visible

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  // Autoplay starts ON, unless the visitor's device asks for reduced motion.
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const total = heroSlides.length;

  // Autoplay: move to the next slide every few seconds.
  // It stops while the mouse is over the hero or keyboard focus is inside it.
  useEffect(() => {
    if (!playing || hovered || focused) return;
    const timer = setInterval(() => {
      setCurrent((index) => (index + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [playing, hovered, focused, total]);

  // When a visitor uses the controls themselves, we stop autoplay
  // so the slides never change by themselves while they are interacting.
  function goTo(index) {
    setCurrent((index + total) % total);
    setPlaying(false);
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured work"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        // Only count as "left" when focus moves outside the hero entirely.
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      className="relative h-[37rem] overflow-hidden bg-obsidian text-ivory sm:h-[34rem] lg:h-[min(36rem,calc(100svh_-_14rem))] lg:min-h-[28rem]"
    >
      {/* Slide images: stacked on top of each other and cross-faded with opacity */}
      <div aria-live={playing ? "off" : "polite"} className="absolute inset-0">
        {heroSlides.map((slide, index) => {
          const active = index === current;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${total}: ${slide.label}`}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              <SiteImage
                image={slide.image}
                className="h-full w-full"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                sizes="100vw"
              />
            </div>
          );
        })}
      </div>

      {/* Dark overlay keeps the text readable over every photo */}
      <div aria-hidden="true" className="absolute inset-0 bg-obsidian/70" />

      {/* Text and buttons (the same on every slide) */}
      <div className="container-page relative z-10 flex h-full flex-col justify-center pb-20 pt-8">
        <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          <span aria-hidden="true" className="h-px w-8 bg-gold" />
          {siteConfig.positioning}
        </p>

        <h1 className="max-w-3xl text-4xl font-medium sm:text-5xl lg:text-6xl">
          Where Fine Craftsmanship Meets Exceptional Spaces.
        </h1>

        <p className="mt-5 max-w-xl text-base text-ivory/90 md:text-lg">
          Discover the artistry of premium marble installations and bespoke POP
          designs by ELITE.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link to="/gallery" className="btn-primary">
            Explore Our Work
          </Link>
          <Link to="/contact" className="btn-outline-light">
            Request a Quote
          </Link>
        </div>
      </div>

      {/* Controls: previous, next, pause/play and slide indicators */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="Previous slide"
              className="inline-flex h-11 w-11 items-center justify-center border border-ivory/50 transition-colors hover:bg-ivory hover:text-obsidian"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="Next slide"
              className="inline-flex h-11 w-11 items-center justify-center border border-ivory/50 transition-colors hover:bg-ivory hover:text-obsidian"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              aria-label={playing ? "Pause slideshow" : "Start slideshow"}
              className="inline-flex h-11 w-11 items-center justify-center border border-ivory/50 transition-colors hover:bg-ivory hover:text-obsidian"
            >
              {playing ? (
                <Pause size={18} aria-hidden="true" />
              ) : (
                <Play size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="flex items-center">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show slide ${index + 1}: ${slide.label}`}
                aria-current={index === current}
                className="flex h-11 w-10 items-center justify-center"
              >
                <span
                  className={`block h-[3px] w-8 transition-colors ${
                    index === current ? "bg-gold" : "bg-ivory/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
