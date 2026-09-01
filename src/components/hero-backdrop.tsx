import { useEffect, useState, type ReactNode } from "react";

const slides = ["/institute-1.jpg", "/institute-2.jpg", "/institute-3.jpg"];

export function HeroBackdrop({
  children,
  minHeight = "min-h-[88vh]",
}: {
  children: ReactNode;
  minHeight?: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((i) => (i + 1) % slides.length), 7000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className={`relative isolate flex ${minHeight} items-end overflow-hidden`}>
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-[1600ms] ease-out"
          style={{
            opacity: i === active ? 1 : 0,
            transform: i === active ? "scale(1)" : "scale(1.06)",
            transition: "opacity 1600ms ease-out, transform 8000ms ease-out",
          }}
        />
      ))}
      {/* Dark scrim overlay: slightly richer on mobile screens so text is crystal-clear in daylight */}
      <div className="hero-scrim absolute inset-0 -z-10 bg-black/60 sm:bg-black/40 backdrop-blur-[0.5px]" />
      <div className="relative w-full">{children}</div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full bg-on-hero transition-all"
            style={{ width: i === active ? 28 : 10, opacity: i === active ? 0.95 : 0.4 }}
          />
        ))}
      </div>
    </section>
  );
}
