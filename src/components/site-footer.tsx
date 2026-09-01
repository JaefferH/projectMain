import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/store/useAppStore";

export function SiteFooter() {
  const { t } = useI18n();
  const { setScreen } = useAppStore();

  return (
    <footer className="border-t border-emerald-200/70 dark:border-border bg-white dark:bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]" />
            </div>
            <span className="font-display text-lg font-extrabold text-[#042c22] dark:text-[#6ee7b7]">{t("school.name")}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-[#064e3b] dark:text-emerald-100/80 font-medium leading-relaxed">{t("footer.tag")}</p>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#047857] dark:text-[#6ee7b7]">
            {t("footer.links")}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { to: "#about", key: "nav.about" },
              { to: "#programs", key: "nav.programs" },
              { to: "#faq", key: "nav.faq" },
              { to: "#contact", key: "nav.contact" },
            ].map((l) => (
              <li key={l.to}>
                <a href={l.to} className="text-[#042c22] dark:text-slate-200 transition-colors hover:text-[#059669] dark:hover:text-[#6ee7b7] font-semibold">
                  {t(l.key)}
                </a>
              </li>
            ))}
            <li>
              <button onClick={() => setScreen('auth')} className="text-[#042c22] dark:text-slate-200 transition-colors hover:text-[#059669] dark:hover:text-[#6ee7b7] font-bold cursor-pointer">
                {t("nav.portal")}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#047857] dark:text-[#6ee7b7]">
            {t("contact.title")}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-[#064e3b] dark:text-emerald-100/80 font-medium leading-relaxed">
            <li>{t("contact.addressV")}</li>
            <li>{t("contact.hoursV")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-emerald-100 dark:border-border px-4 py-5 text-center text-xs text-[#047857] dark:text-emerald-300 font-semibold space-y-1">
        <div>© {new Date().getFullYear()} {t("school.name")}. {t("footer.rights")}</div>
        <p className="opacity-40 hover:opacity-100 transition-opacity text-[11px] tracking-wider mt-1">
          <span className="font-medium">Jaeffer Hussein</span> ·{" "}
          <a href="mailto:Jaefferhussein@gmail.com" className="hover:underline">
            Jaefferhussein@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}

