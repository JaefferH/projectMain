import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { knowledgeQuotes } from "@/lib/quotes";

export function HeroQuote() {
  const { lang } = useI18n();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % knowledgeQuotes.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <figure className="mt-4 min-h-[7.5rem]">
      {knowledgeQuotes.map((q, i) => (
        <blockquote
          key={q.id}
          aria-hidden={i !== index}
          className={`transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none absolute opacity-0"}`}
        >
          {lang !== "ar" && (
            <p dir="rtl" lang="ar" className="font-display text-2xl text-gold sm:text-3xl">
              {q.arabic}
            </p>
          )}
          <p className="mt-2 font-display text-xl text-on-hero sm:text-2xl">{q.text[lang]}</p>
          <figcaption className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-hero-muted">
            <span aria-hidden className="h-px w-8 bg-gold/70" />
            {q.ref[lang]}
          </figcaption>
        </blockquote>
      ))}
    </figure>
  );
}
