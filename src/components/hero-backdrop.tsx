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
          alt="Al Imam Hassan Mosque & Madrasah"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center transition-opacity duration-[1600ms] ease-out brightness-105"
          style={{
            opacity: i === active ? 1 : 0,
            transform: i === active ? "scale(1)" : "scale(1.05)",
            transition: "opacity 1600ms ease-out, transform 8000ms ease-out",
          }}
        />
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/20 to-[#021a12]/80 sm:from-black/50 sm:via-black/30 sm:to-[#021a12]/90" />
      <div className="relative w-full">{children}</div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full bg-white transition-all cursor-pointer"
            style={{ width: i === active ? 28 : 10, opacity: i === active ? 0.95 : 0.4 }}
          />
        ))}
      </div>
    </section>
  );
}

