import { PageHeader, PageShell } from "@/components/page-shell";
import { useI18n } from "@/lib/i18n";

export function Programs() {
  const { t, lang } = useI18n();
  const items = [
    { t: "p1.title", b: "p1.body", meta: { en: "From age 4", am: "ከ4 ዓመት ጀምሮ", ar: "من سن الرابعة" } },
    {
      t: "p2.title",
      b: "p2.body",
      meta: { en: "Primary school students", am: "የፕራይመሪ ተማሪዎች", ar: "طلاب المرحلة الابتدائية" },
    },
    {
      t: "p3.title",
      b: "p3.body",
      meta: { en: "Secondary school students", am: "የሰከንደሪ ተማሪዎች", ar: "طلاب المرحلة الثانوية" },
    },
    {
      t: "p4.title",
      b: "p4.body",
      meta: { en: "University level", am: "የዩኒቨርሲቲ ደረጃ", ar: "المرحلة الجامعية" },
    },
    { t: "p5.title", b: "p5.body", meta: { en: "Youth", am: "ወጣቶች", ar: "الشباب" } },
    {
      t: "p6.title",
      b: "p6.body",
      meta: { en: "No age limit", am: "የእድሜ ገደብ የለውም", ar: "بلا حدّ للعمر" },
    },
    { t: "p7.title", b: "p7.body", meta: { en: "Coming soon", am: "በቅርቡ", ar: "قريباً" } },
  ] as const;

  return (
    <PageShell>
      <PageHeader title={t("programs.title")} subtitle={t("programs.sub")} />
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-16 sm:px-6 md:grid-cols-2">
        {items.map((p) => (
          <article key={p.t} className="rounded-2xl bg-white dark:bg-[#042f22]/90 flex flex-col p-6 border border-emerald-200 dark:border-[#34d399]/30 shadow-md hover:shadow-xl transition-all hover:scale-[1.01]">
            <h2 className="font-display text-xl font-extrabold text-[#042c22] dark:text-[#6ee7b7]">{t(p.t)}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[#064e3b] dark:text-emerald-100/90 font-medium">{t(p.b)}</p>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#047857] dark:text-[#34d399] bg-emerald-100 dark:bg-[#34d399]/20 px-3 py-1 rounded-full self-start border border-emerald-300 dark:border-[#34d399]/30 shadow-sm">
              {p.meta[lang]}
            </p>
          </article>
        ))}
      </section>
    </PageShell>
  );
}

export default Programs;
