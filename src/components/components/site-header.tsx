import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

import { languages, nextLang, useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/about", key: "nav.about" },
  { to: "/programs", key: "nav.programs" },
  { to: "/faq", key: "nav.faq" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover shadow-sm" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold sm:text-lg">{t("school.short")}</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t("school.kicker")}
            </span>
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <button
            type="button"
            onClick={() => setLang(nextLang(lang))}
            className="rounded-md border border-border px-2.5 py-2 text-xs font-semibold tracking-wide text-foreground transition-colors hover:bg-accent"
            aria-label="Change language"
          >
            {languages.find((l) => l.code === nextLang(lang))?.label}
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={t("theme.toggle")}
            className="rounded-md border border-border p-2 text-foreground transition-colors hover:bg-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/portal"
            className="hidden rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex"
          >
            {t("nav.portal")}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-md border border-border p-2 lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {t(l.key)}
            </Link>
          ))}
          <Link
            to="/portal"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
          >
            {t("nav.portal")}
          </Link>
        </nav>
      )}
    </header>
  );
}
