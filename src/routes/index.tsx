import { BookOpen, GraduationCap, HeartHandshake, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { HeroBackdrop } from "@/components/hero-backdrop";
import { HeroQuote } from "@/components/hero-quote";
import { PageShell } from "@/components/page-shell";
import { useI18n } from "@/lib/i18n";

const stats = [
  { value: "4+", key: "stats.students", icon: Users },
  { value: "7", key: "stats.teachers", icon: GraduationCap },
  { value: "5+", key: "stats.huffaz", icon: BookOpen },
  { value: "2003", key: "stats.years", icon: HeartHandshake },
] as const;

const programs = [
  { t: "p1.title", b: "p1.body" },
  { t: "p2.title", b: "p2.body" },
  { t: "p3.title", b: "p3.body" },
  { t: "p4.title", b: "p4.body" },
  { t: "p5.title", b: "p5.body" },
  { t: "p6.title", b: "p6.body" },
] as const;

function Home() {
  const { t, lang } = useI18n();

  return (
    <PageShell>
      <HeroBackdrop>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-32 sm:pb-24 sm:pt-36 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl text-left space-y-4 sm:space-y-5"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0">
                <img src="/logo.png" alt="Al Imam Hassan Logo" className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(110,231,183,0.5)]" />
              </div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] text-[#6ee7b7] bg-black/75 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#6ee7b7]/50 shadow-lg">
                <Sparkles className="h-3.5 w-3.5 text-[#6ee7b7] animate-spin" /> {t("hero.eyebrow")}
              </p>
            </div>
            
            {/* ── DYNAMIC 3-LANGUAGE TITLE STACK ── */}
            <div className="space-y-3">
              {lang === "ar" ? (
                /* Arabic Title */
                <h1 dir="rtl" lang="ar" className="font-arabic text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#6ee7b7] leading-relaxed drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)] sm:drop-shadow-[0_0_30px_rgba(110,231,183,0.7)] tracking-wide">
                  مَسْجِدُ وَمَدْرَسَةُ الإِمَامِ حَسَنٍ
                </h1>
              ) : lang === "am" ? (
                /* Amharic Title */
                <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)]">
                  አል ኢማም ሀሰን መስጂድ እና መድረሳ
                </h1>
              ) : (
                /* English Title */
                <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)]">
                  Al Imam Hassan Mosque &amp; Madrasah
                </h1>
              )}

              {/* Sub-Crest Badge */}
              <div className="pt-1">
                <span className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#021f17] border-2 border-[#fbbf24] text-[#fef08a] text-xs sm:text-sm font-black uppercase tracking-[0.14em] sm:tracking-[0.18em] shadow-[0_0_25px_rgba(251,191,36,0.6)] backdrop-blur-md font-arabic max-w-full">
                  <Sparkles className="h-4 w-4 text-[#fbbf24] shrink-0 animate-pulse" />
                  <span className="text-[#fef08a] font-black">Mosque &amp; Madrasah • መስጂድ እና መድረሳ</span>
                </span>
              </div>
            </div>
            
            <div className="relative pt-2">
              <HeroQuote />
            </div>
            
            <p className="max-w-xl text-base sm:text-lg leading-relaxed font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              {t("hero.sub")}
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href="#contact"
                className="w-full sm:w-auto text-center rounded-xl bg-gradient-to-r from-[#6ee7b7] via-[#34d399] to-[#10b981] hover:brightness-110 text-[#021a12] px-8 py-3.5 text-base font-black shadow-[0_0_25px_rgba(110,231,183,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {t("hero.cta1")} &rarr;
              </a>
              <a
                href="#programs"
                className="w-full sm:w-auto text-center rounded-xl bg-black/75 hover:bg-black/90 text-white border border-[#6ee7b7]/50 px-8 py-3.5 text-base font-bold backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-lg"
              >
                {t("hero.cta2")}
              </a>
            </div>
          </motion.div>
        </div>
      </HeroBackdrop>

      {/* ── STATS SECTION ── */}
      <section className="border-y border-emerald-200/80 dark:border-emerald-900/60 bg-white dark:bg-[#032319] shadow-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.key} className="flex items-start gap-3.5">
              <s.icon className="mt-1 h-6 w-6 shrink-0 text-[#059669] dark:text-[#34d399]" />
              <div>
                <div className="font-display text-3xl sm:text-4xl font-black text-[#022c1e] dark:text-[#fef08a]">{s.value}</div>
                <div className="text-xs sm:text-sm font-bold text-[#047857] dark:text-[#a7f3d0] mt-0.5">{t(s.key)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SEE OUR LEVELS (PROGRAMS) SECTION ── */}
      <section id="programs" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#022c1e] dark:via-[#033a2a] dark:to-[#021f17] p-6 sm:p-14 border border-emerald-200 dark:border-[#10b981]/30 shadow-xl dark:shadow-[0_15px_45px_rgba(2,26,18,0.7)] text-[#022c1e] dark:text-white">
          <div className="pattern-grid pointer-events-none absolute inset-0 opacity-5 dark:text-white/10" />
          <div className="relative z-10">
            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-[#6ee7b7]/20 text-[#047857] dark:text-[#6ee7b7] text-xs font-black uppercase tracking-widest mb-3 border border-emerald-300 dark:border-[#6ee7b7]/40 shadow-sm">
              Academic Offerings
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#022c1e] dark:text-[#6ee7b7] tracking-wide">{t("programs.title")}</h2>
            <p className="mt-3 max-w-2xl text-base text-[#064e3b] dark:text-emerald-100/90 font-medium">{t("programs.sub")}</p>
            
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {programs.map((p) => (
                <article key={p.t} className="rounded-2xl bg-[#f0fdf4] dark:bg-[#021f17]/90 hover:bg-[#dcfce7] dark:hover:bg-[#032e22] p-6 border border-emerald-200/90 dark:border-[#34d399]/30 shadow-sm dark:shadow-md transition-all hover:-translate-y-1 hover:border-[#059669] dark:hover:border-[#6ee7b7] hover:shadow-lg">
                  <h3 className="font-display text-xl font-extrabold text-[#022c1e] dark:text-[#fef08a]">{t(p.t)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#064e3b] dark:text-emerald-100/90 font-medium">{t(p.b)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT / VISIT BANNER ── */}
      <section id="contact" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857] p-6 sm:p-12 border border-[#34d399]/40 shadow-[0_12px_40px_rgba(16,185,129,0.3)] text-white">
          <div className="pattern-grid pointer-events-none absolute inset-0 text-white/10" />
          <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-widest mb-3 border border-white/30 shadow-sm">
                Madrasah Campus Visit
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-wide drop-shadow-sm">
                {t("cta.title")}
              </h2>
              <p className="mt-2 max-w-xl text-sm sm:text-base text-emerald-50 font-medium leading-relaxed drop-shadow-sm">
                {t("cta.sub")}
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-emerald-50 text-[#022c1e] px-7 py-3.5 text-sm font-black shadow-xl transition-all hover:scale-105 cursor-pointer shrink-0 w-full sm:w-auto text-center"
            >
              <span>{t("hero.cta1")}</span>
              <span className="text-base">&rarr;</span>
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default Home;
export { Home };


