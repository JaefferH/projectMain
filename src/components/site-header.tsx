import { Menu, Moon, Sun, X, Globe, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { languages, useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const links = [
  { screen: "landing", key: "nav.home" },
  { screen: "about", key: "nav.about" },
  { screen: "programs", key: "nav.programs" },
  { screen: "faq", key: "nav.faq" },
  { screen: "contact", key: "nav.contact" },
] as const;

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const { setScreen, currentScreen } = useAppStore();
  const [open, setOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <button className="flex items-center gap-3 text-start cursor-pointer" onClick={() => { setOpen(false); setScreen('landing'); }}>
          <div className="h-11 w-11 shrink-0">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]" />
          </div>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold sm:text-lg text-[#042c22] dark:text-[#6ee7b7]">{t("school.short")}</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#047857] dark:text-emerald-300/80 font-semibold">
              {t("school.kicker")}
            </span>
          </span>
        </button>

        <nav className="mx-auto hidden items-center gap-1.5 lg:flex">
          {links.map((l) => (
            <button
              key={l.screen}
              onClick={() => setScreen(l.screen as any)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                currentScreen === l.screen
                  ? "bg-[#10b981]/20 text-[#047857] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7] border border-[#10b981]/40 dark:border-[#6ee7b7]/40 shadow-sm font-extrabold"
                  : "text-[#047857] dark:text-emerald-100/90 hover:text-[#042c22] dark:hover:text-white hover:bg-[#10b981]/15 dark:hover:bg-[#6ee7b7]/15"
              }`}
            >
              {t(l.key)}
            </button>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          
          {/* ── INTERACTIVE LANGUAGE DROPDOWN MENU ── */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((v) => !v)}
              className="rounded-xl border border-emerald-500/40 dark:border-emerald-400/30 px-3 py-2 text-xs font-bold tracking-wide text-[#047857] dark:text-emerald-100 bg-[#ecfdf5] dark:bg-[#042f22]/60 hover:bg-[#10b981]/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              aria-label="Select language"
            >
              <Globe className="h-3.5 w-3.5 text-[#047857] dark:text-[#6ee7b7]" />
              <span>{languages.find((l) => l.code === lang)?.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-[#047857] dark:text-[#6ee7b7] transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-[#042f22] border border-emerald-200 dark:border-[#34d399]/40 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#047857] dark:text-[#6ee7b7] border-b border-emerald-100 dark:border-emerald-800/60 mb-1">
                  Select Language / ቋንቋ
                </div>
                {languages.map((l) => {
                  const isSelected = l.code === lang;
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as Lang);
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs font-extrabold rounded-xl transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-emerald-100 text-[#047857] dark:bg-[#6ee7b7]/20 dark:text-[#6ee7b7]"
                          : "text-[#042c22] dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {l.code === "en" ? "🇬🇧" : l.code === "am" ? "🇪🇹" : "🇸🇦"}
                        <span>{l.label}</span>
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#047857] dark:text-[#6ee7b7]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={t("theme.toggle")}
            className="rounded-xl border border-emerald-500/40 dark:border-emerald-400/30 p-2 text-[#047857] dark:text-emerald-100 bg-[#ecfdf5] dark:bg-[#042f22]/60 hover:bg-[#10b981]/20 transition-all cursor-pointer"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-[#6ee7b7]" /> : <Moon className="h-4 w-4 text-[#047857]" />}
          </button>
          <button
            type="button"
            onClick={() => setScreen('auth')}
            className="hidden rounded-xl bg-gradient-to-r from-[#6ee7b7] via-[#34d399] to-[#10b981] hover:from-[#a7f3d0] hover:to-[#34d399] text-[#021a12] px-5 py-2 text-xs font-extrabold shadow-[0_4px_18px_rgba(110,231,183,0.35)] transition-all hover:scale-105 active:scale-95 cursor-pointer sm:inline-flex"
          >
            {t("nav.portal")}
          </button>
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
        <nav className="border-t border-emerald-200 dark:border-border bg-white dark:bg-[#021a12] px-4 py-4 lg:hidden shadow-xl space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {links.map((l) => (
            <button
              key={l.screen}
              onClick={() => { setOpen(false); setScreen(l.screen as any); }}
              className={`block w-full text-start rounded-xl px-4 py-3 text-sm font-extrabold transition-all cursor-pointer ${
                currentScreen === l.screen
                  ? "bg-emerald-100 text-[#047857] dark:bg-[#6ee7b7]/20 dark:text-[#6ee7b7] border border-emerald-300 dark:border-[#6ee7b7]/30"
                  : "text-[#042c22] dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              }`}
            >
              {t(l.key)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setOpen(false); setScreen('auth'); }}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#10b981] to-[#047857] px-4 py-3.5 text-center text-sm font-black text-white shadow-lg cursor-pointer hover:brightness-105 active:scale-95 transition-all"
          >
            {t("nav.portal")} &rarr;
          </button>
        </nav>
      )}
    </header>
  );
}
