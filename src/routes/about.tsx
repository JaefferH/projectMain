import { PageHeader, PageShell } from "@/components/page-shell";
import { useI18n } from "@/lib/i18n";

export function About() {
  const { t } = useI18n();
  const pillars = [
    { t: "about.missionT", b: "about.missionB" },
    { t: "about.visionT", b: "about.visionB" },
    { t: "about.valuesT", b: "about.valuesB" },
  ] as const;

  return (
    <PageShell>
      <PageHeader title={t("about.title")} subtitle={t("about.lead")} />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#064e3b] dark:text-emerald-100/90 font-medium">
          <p>{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
          <p>{t("about.p3")}</p>
        </div>
        <img
          src="/institute-3.jpg"
          alt="The Al Imam Hassan Mosque & Madereesa building surrounded by gardens"
          width={1920}
          height={1088}
          loading="lazy"
          className="h-72 w-full rounded-2xl object-cover shadow-lift sm:h-96"
        />
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-12 sm:px-6 md:grid-cols-3">
        {pillars.map((p) => (
          <article key={p.t} className="rounded-2xl bg-white dark:bg-[#042f22]/90 p-6 border border-emerald-200 dark:border-[#34d399]/30 shadow-lg transition-all hover:scale-[1.02]">
            <h2 className="font-display text-xl font-extrabold text-[#042c22] dark:text-[#6ee7b7]">{t(p.t)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#064e3b] dark:text-emerald-100/90 font-medium">{t(p.b)}</p>
          </article>
        ))}
      </section>

      <section className="border-t border-emerald-100 dark:border-border bg-white dark:bg-card/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-[#6ee7b7]/20 text-[#047857] dark:text-[#6ee7b7] text-xs font-black uppercase tracking-widest mb-3 border border-emerald-300 dark:border-[#6ee7b7]/30 shadow-sm">
              Admissions Policy
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#042c22] dark:text-[#6ee7b7]">{t("admissions.title")}</h2>
            <p className="mt-2 text-[#064e3b] dark:text-emerald-100/90 font-medium text-base">{t("admissions.sub")}</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { titleKey: "admissions.whoT", bodyKey: "admissions.whoB" },
              { titleKey: "admissions.reqT", bodyKey: "admissions.reqB" },
              { titleKey: "admissions.docT", bodyKey: "admissions.docB" },
              { titleKey: "admissions.procT", bodyKey: "admissions.procB" },
              { titleKey: "admissions.examT", bodyKey: "admissions.examB" },
              { titleKey: "admissions.periodT", bodyKey: "admissions.periodB" },
              { titleKey: "admissions.feesT", bodyKey: "admissions.feesB" },
              {
                titleKey: "admissions.contactT",
                bodyKey: "admissions.contactB",
                isPhone: true,
              },
            ].map((item) => (
              <article key={item.titleKey} className="rounded-2xl bg-[#f4fbf7] dark:bg-[#042f22] flex flex-col justify-between p-6 border border-emerald-200 dark:border-[#34d399]/40 shadow-md hover:shadow-xl transition-all">
                <div>
                  <h3 className="font-display text-lg font-extrabold text-[#042c22] dark:text-[#6ee7b7]">{t(item.titleKey)}</h3>
                  {item.isPhone ? (
                    <a
                      href={`tel:${t(item.bodyKey)}`}
                      className="mt-2.5 inline-block font-mono text-base font-extrabold text-[#047857] dark:text-[#34d399] hover:underline"
                    >
                      {t(item.bodyKey)}
                    </a>
                  ) : (
                    <p className="mt-2.5 text-sm leading-relaxed text-[#064e3b] dark:text-emerald-100 font-medium">{t(item.bodyKey)}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default About;
