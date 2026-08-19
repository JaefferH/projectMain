import { BookOpen, ChevronDown, Clock, HelpCircle, Users } from "lucide-react";
import { useState } from "react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { useI18n } from "@/lib/i18n";

const groups = [
  { key: "faq.ages", icon: Users, items: [1, 2] },
  { key: "faq.learning", icon: BookOpen, items: [3, 4, 5] },
  { key: "faq.practical", icon: Clock, items: [6] },
] as const;

export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(1);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5, 6].map((n) => ({
      "@type": "Question",
      name: t(`faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.a${n}`) },
    })),
  };

  return (
    <PageShell>
      <PageHeader title={t("faq.title")} subtitle={t("faq.lead")} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-10">
            {groups.map((g) => (
              <div key={g.key}>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <g.icon className="h-4.5 w-4.5 text-primary" />
                  {t(g.key)}
                </h2>
                <div className="mt-4 space-y-3">
                  {g.items.map((n) => {
                    const isOpen = open === n;
                    return (
                      <div key={n} className="rounded-2xl bg-white dark:bg-[#042f22]/90 border border-emerald-200 dark:border-[#34d399]/30 shadow-md overflow-hidden transition-all">
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? null : n)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center gap-3 px-5 py-4 text-start cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <span className="flex-1 font-display text-base font-extrabold sm:text-lg text-[#042c22] dark:text-[#6ee7b7]">
                            {t(`faq.q${n}`)}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-[#047857] dark:text-[#34d399] transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen && (
                          <p className="border-t border-emerald-200 dark:border-[#34d399]/30 px-5 py-4 text-sm font-medium leading-relaxed text-[#047857] dark:text-emerald-100/90 bg-emerald-50/50 dark:bg-emerald-950/40">
                            {t(`faq.a${n}`)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <aside className="card-surface h-fit p-6 lg:sticky lg:top-24">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-display text-xl font-bold">{t("faq.stillT")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("faq.stillB")}</p>
            <a
              href="#contact"
              className="mt-5 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("nav.contact")}
            </a>
            <ul className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
              <li>
                <a href="#programs" className="text-foreground/80 hover:text-primary">
                  {t("nav.programs")}
                </a>
              </li>
              <li>
                <a href="#about" className="text-foreground/80 hover:text-primary">
                  {t("nav.about")}
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#047857] via-[#059669] to-[#10b981] p-8 sm:p-12 border border-[#34d399]/40 shadow-[0_12px_40px_rgba(16,185,129,0.3)]">
          <div className="pattern-grid pointer-events-none absolute inset-0 text-white/10" />
          <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#6ee7b7]/20 text-[#6ee7b7] text-xs font-bold uppercase tracking-widest mb-3 border border-[#6ee7b7]/30">
                Madrasah Campus Visit
              </span>
              <h2 className="font-display text-2xl font-extrabold text-[#6ee7b7] sm:text-3xl tracking-wide drop-shadow-sm">
                {t("cta.title")}
              </h2>
              <p className="mt-2 max-w-xl text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed">
                {t("cta.sub")}
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6ee7b7] hover:bg-[#a7f3d0] text-[#021a12] px-7 py-3.5 text-sm font-extrabold shadow-lg transition-all hover:scale-105 cursor-pointer shrink-0"
            >
              <span>{t("hero.cta1")}</span>
              <span className="text-base">&rarr;</span>
            </a>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </PageShell>
  );
}

export default Faq;
