import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAppStore } from "@/store/useAppStore";

type Theme = "light" | "dark";

type Ctx = { theme: Theme; toggle: () => void };

const ThemeContext = createContext<Ctx | null>(null);

const PUBLIC_WEBSITE_PAGES = ['landing', 'about', 'programs', 'contact', 'faq'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const { currentScreen, authenticated } = useAppStore();

  const isPortal = authenticated || currentScreen === 'auth' || !PUBLIC_WEBSITE_PAGES.includes(currentScreen);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (isPortal) {
      // Inside portals and portal login: ALWAYS NIGHT MODE ONLY
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      // Public website pages: respect the user's Day / Night choice
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
        document.documentElement.removeAttribute("data-theme");
      }
    }
  }, [isPortal, theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

