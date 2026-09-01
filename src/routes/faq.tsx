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
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#042c22] dark:text-[#6ee7b7]">
                  <g.icon className="h-5 w-5 text-[#059669] dark:text-[#34d399]" />
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
                          <p className="border-t border-emerald-200 dark:border-[#34d399]/30 px-5 py-4 text-sm font-medium leading-relaxed text-[#064e3b] dark:text-emerald-100/90 bg-emerald-50/50 dark:bg-emerald-950/40">
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

          <aside className="rounded-2xl bg-white dark:bg-card border border-emerald-200 dark:border-border p-6 shadow-md lg:sticky lg:top-24 h-fit">
            <HelpCircle className="h-7 w-7 text-[#059669] dark:text-[#34d399]" />
            <h2 className="mt-3 font-display text-xl font-extrabold text-[#042c22] dark:text-white">{t("faq.stillT")}</h2>
            <p className="mt-2 text-sm font-medium text-[#064e3b] dark:text-emerald-100/80 leading-relaxed">{t("faq.stillB")}</p>
            <a
              href="#contact"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#047857] text-white px-5 py-3 text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              <span>{t("contact.title")}</span>
              <span>&rarr;</span>
            </a>
            <ul className="mt-6 space-y-2 border-t border-emerald-100 dark:border-border pt-5 text-sm">
              <li>
                <a href="#programs" className="text-[#042c22] dark:text-slate-200 hover:text-[#059669] dark:hover:text-[#6ee7b7] font-semibold">
                  {t("nav.programs")}
                </a>
              </li>
              <li>
                <a href="#about" className="text-[#042c22] dark:text-slate-200 hover:text-[#059669] dark:hover:text-[#6ee7b7] font-semibold">
                  {t("nav.about")}
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857] p-8 sm:p-12 border border-[#34d399]/40 shadow-[0_12px_40px_rgba(16,185,129,0.3)] text-white">
          <div className="pattern-grid pointer-events-none absolute inset-0 text-white/10" />
          <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-widest mb-3 border border-white/30 shadow-sm">
                Madrasah Campus Visit
              </span>
              <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl tracking-wide drop-shadow-sm">
                {t("cta.title")}
              </h2>
              <p className="mt-2 max-w-xl text-sm sm:text-base text-emerald-50 font-medium leading-relaxed drop-shadow-sm">
                {t("cta.sub")}
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-emerald-50 text-[#042c22] px-7 py-3.5 text-sm font-black shadow-lg transition-all hover:scale-105 cursor-pointer shrink-0"
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
