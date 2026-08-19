import { Building2, Clock, MapPin, Navigation, UserPlus, PhoneCall } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { useI18n } from "@/lib/i18n";

const MAP_QUERY = "Imam Hassan Mosque, Atena Tera, Kolfe, Addis Ababa, Ethiopia";
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;
const PHONE_NUMBER = "+251 945 500 403";
const PHONE_TEL = "tel:+251945500403";

export function Contact() {
  const { t } = useI18n();

  const details = [
    { icon: PhoneCall, label: "Call Us Now", value: PHONE_NUMBER, isPhone: true, href: PHONE_TEL },
    { icon: MapPin, label: "contact.address", value: t("contact.addressV") },
    { icon: Building2, label: "contact.place", value: t("contact.placeV") },
    { icon: Clock, label: "contact.hours", value: t("contact.hoursV") },
  ] as const;

  return (
    <PageShell>
      <PageHeader title={t("contact.title")} subtitle={t("contact.sub")} />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        
        {/* ── COOL CALL US NOW BANNER CARD ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#047857] via-[#059669] to-[#10b981] p-8 sm:p-12 border border-[#34d399]/40 shadow-[0_12px_40px_rgba(16,185,129,0.35)] text-white mb-10">
          <div className="pattern-grid pointer-events-none absolute inset-0 text-white/10" />
          <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-[#6ee7b7] border border-white/30 shadow-inner shrink-0">
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6ee7b7] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#6ee7b7]"></span>
                </span>
                <PhoneCall className="h-8 w-8 animate-bounce" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[#6ee7b7]/20 text-[#6ee7b7] text-xs font-extrabold uppercase tracking-widest mb-1.5 border border-[#6ee7b7]/30 shadow-sm">
                  Direct Line • Phone Support
                </span>
                <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl tracking-wide drop-shadow-sm">
                  Call Us Now
                </h2>
                <p className="text-emerald-100/90 font-medium text-sm mt-0.5">
                  Have questions or want to register? Speak directly with our madrasah administration.
                </p>
              </div>
            </div>

            <a
              href={PHONE_TEL}
              className="inline-flex items-center gap-3 rounded-xl bg-[#6ee7b7] hover:bg-[#a7f3d0] text-[#021a12] px-8 py-4 text-base font-extrabold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <PhoneCall className="h-5 w-5 text-[#021a12]" />
              <span>{PHONE_NUMBER}</span>
            </a>
          </div>
        </div>

        {/* ── CONTACT DETAILS GRID ── */}
        <ul className="grid gap-4 sm:grid-cols-2">
          {details.map((d) => (
            <li key={d.label} className="rounded-2xl bg-white dark:bg-[#042f22]/90 flex items-start gap-4 p-5 border border-emerald-200 dark:border-[#34d399]/30 shadow-md transition-all hover:scale-[1.01]">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-[#34d399]/20 text-[#047857] dark:text-[#6ee7b7] shrink-0 border border-emerald-300 dark:border-[#34d399]/30">
                <d.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#047857] dark:text-[#6ee7b7]">
                  {d.label.startsWith("contact.") ? t(d.label) : d.label}
                </div>
                {"isPhone" in d ? (
                  <a
                    href={d.href}
                    className="mt-1 inline-block font-mono text-base font-extrabold text-[#047857] dark:text-[#34d399] hover:underline"
                  >
                    {d.value}
                  </a>
                ) : (
                  <div className="mt-1 text-sm font-semibold text-[#042c22] dark:text-emerald-100">{d.value}</div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* ── MAP SECTION ── */}
        <div className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-[#6ee7b7]/20 text-[#047857] dark:text-[#6ee7b7] text-xs font-extrabold uppercase tracking-widest mb-2 border border-emerald-300 dark:border-[#6ee7b7]/30 shadow-sm">
                Campus Location
              </span>
              <h2 className="font-display text-2xl font-extrabold text-[#042c22] dark:text-white sm:text-3xl">{t("contact.map")}</h2>
              <p className="mt-1 max-w-xl text-sm font-medium text-[#047857] dark:text-emerald-100/80">{t("contact.mapSub")}</p>
            </div>
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6ee7b7] via-[#34d399] to-[#10b981] text-[#021a12] px-5 py-3 text-sm font-extrabold shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Navigation className="h-4 w-4 text-[#021a12]" />
              {t("contact.directions")}
            </a>
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl border-2 border-emerald-200 dark:border-[#34d399]/40 shadow-xl p-0">
            <iframe
              title={t("contact.map")}
              src={MAP_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[22rem] w-full border-0 sm:h-[28rem]"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default Contact;
