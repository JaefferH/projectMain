import { Link } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" width={36} height={36} loading="lazy" className="h-9 w-9 rounded-full object-cover shadow-sm" />
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
              { to: "/about", key: "nav.about" },
              { to: "/programs", key: "nav.programs" },
              { to: "/faq", key: "nav.faq" },
              { to: "/contact", key: "nav.contact" },
              { to: "/portal", key: "nav.portal" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-foreground/80 transition-colors hover:text-primary">
                  {t(l.key)}
                </Link>
              </li>
            ))}
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
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("school.name")}. {t("footer.rights")}
      </div>
    </footer>
  );
}
