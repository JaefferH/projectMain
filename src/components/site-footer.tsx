import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/store/useAppStore";

export function SiteFooter() {
  const { t } = useI18n();
  const { setScreen } = useAppStore();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]" />
            </div>
            <span className="font-display text-lg font-bold">{t("school.name")}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t("footer.tag")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("footer.links")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { to: "#about", key: "nav.about" },
              { to: "#programs", key: "nav.programs" },
              { to: "#faq", key: "nav.faq" },
              { to: "#contact", key: "nav.contact" },
            ].map((l) => (
              <li key={l.to}>
                <a href={l.to} className="text-foreground/80 transition-colors hover:text-primary">
                  {t(l.key)}
                </a>
              </li>
            ))}
            <li>
              <button onClick={() => setScreen('auth')} className="text-foreground/80 transition-colors hover:text-primary font-semibold">
                {t("nav.portal")}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("contact.title")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>{t("contact.addressV")}</li>
            <li>{t("contact.hoursV")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground space-y-1">
        <div>© {new Date().getFullYear()} {t("school.name")}. {t("footer.rights")}</div>
        <p className="opacity-25 hover:opacity-75 transition-opacity text-muted-foreground text-[10px] tracking-wider mt-1">
          <span className="font-medium">Jaeffer Hussein</span> ·{" "}
          <a href="mailto:Jaefferhussein@gmail.com" className="hover:underline">
            Jaefferhussein@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
