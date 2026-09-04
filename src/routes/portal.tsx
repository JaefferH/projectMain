import { useState, useRef, useEffect } from "react";
import { Lock, Eye, EyeOff, Globe, ChevronDown, Check, Shield, GraduationCap, UserCheck, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { languages, useI18n, type Lang } from "@/lib/i18n";

function Portal() {
  const { t, lang, setLang } = useI18n();
  const { setScreen, login } = useAppStore();
  
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleQuickFill = (u: string, p: string) => {
    setStaffId(u);
    setPassword(p);
    setError("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanUser = staffId.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError("Please enter both ID / Username and Password.");
      setLoading(false);
      return;
    }

    let backendSuccess = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data && (data.accessToken || data.success)) {
          const userObj = data.user || { id: 'admin_1', name: 'Master Admin', username: cleanUser };
          localStorage.setItem("accessToken", data.accessToken || "mock-token");
          localStorage.setItem("userRole", userObj.role || "ADMIN");
          localStorage.setItem("currentUser", JSON.stringify(userObj));

          const roleStr = (userObj.role || "").toLowerCase();
          const isTeacher = roleStr.includes("teacher");
          const isStudent = roleStr.includes("student");
          const role: "student" | "teacher" | "admin" = isStudent ? "student" : isTeacher ? "teacher" : "admin";
          const targetScreen = isStudent ? "student_dashboard" : isTeacher ? "teacher_dashboard" : "admin_dashboard";

          useAppStore.setState({
            authenticated: true,
            userRole: role,
            currentUser: { id: userObj.id, name: userObj.name, username: userObj.username },
            currentScreen: targetScreen as any,
          });
          backendSuccess = true;
          setLoading(false);
          return;
        }
      }
    } catch {
      // Backend not running or static hosting (Vercel) — proceed to instant local auth
    }

    // 2. Local Fallback Auth (Instant & Works 100% on deployed phones & offline)
    if (!backendSuccess) {
      const localSuccess = login(cleanUser, cleanPass);
      if (!localSuccess) {
        setError("Invalid ID or Password. Tap any Quick Demo button below to test.");
      }
    }
    setLoading(false);
  };

  const isDark = true;

  return (
    <div className="dark grid min-h-screen lg:grid-cols-2 bg-[#021a12] text-white transition-colors duration-300">
      {/* Left Branding Hero (Desktop) */}
      <div className="relative hidden overflow-hidden bg-[#042f22] text-white lg:block border-r border-[#34d399]/30">
        <div className="pattern-grid pointer-events-none absolute inset-0 text-white/10" />
        <img
          src="/institute-2.jpg"
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative flex h-full flex-col justify-between p-12 z-10">
          <div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-950/60 px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-[#6ee7b7]">
              Al Imam Hassan Mosque & Madrasah
            </span>
          </div>
          <div>
            <blockquote className="font-display text-3xl font-extrabold leading-relaxed sm:text-4xl text-[#6ee7b7]">
              “وَقُل رَّبِّ زِدْنِي عِلْمًا”
            </blockquote>
            <p className="mt-3 text-sm text-emerald-100/90 font-medium">
              “And say, 'My Lord, increase me in knowledge.'” — Surah Taha (20:114)
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex items-center justify-center p-4 sm:p-8 md:p-12 bg-[#021a12] text-white transition-colors duration-300">
        <div className="mx-auto w-full max-w-sm">
          {/* Header & Controls */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]" />
              </div>
              <span className="text-xs font-bold text-[#d4af37] font-mono tracking-wider sm:hidden">
                AL-IMAM HASSAN
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* ── PORTAL LANGUAGE DROPDOWN ── */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((v) => !v)}
                  className="rounded-xl border border-emerald-700/60 bg-[#042f22] text-emerald-100 hover:bg-emerald-800 px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{languages.find((l) => l.code === lang)?.label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#042f22] border border-emerald-700/60 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#6ee7b7] border-b border-emerald-800 mb-1">
                      Language / ቋንቋ
                    </div>
                    {languages.map((l) => {
                      const isSelected = l.code === lang;
                      return (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setLang(l.code as Lang);
                            setLangMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-xs font-extrabold rounded-xl transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#6ee7b7]/20 text-[#6ee7b7]"
                              : "text-emerald-100 hover:bg-emerald-900/40"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {l.code === "en" ? "🇬🇧" : l.code === "am" ? "🇪🇹" : "🇸🇦"}
                            <span>{l.label}</span>
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#6ee7b7]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <h1 className={`font-display text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-[#042c22]'}`}>{t("portal.title")}</h1>
          <p className={`mt-1.5 text-xs sm:text-sm ${isDark ? 'text-emerald-100/70' : 'text-emerald-800/80'}`}>{t("portal.sub")}</p>

          {/* Quick Demo Fill Badges (Super Convenient on Mobile Phones!) */}
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#d4af37] mb-2 uppercase tracking-wide">
              <Sparkles size={13} className="text-[#d4af37]" />
              <span>Tap to Test / Quick Demo Fill:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("admin", "newAdmin@123")}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-200 transition-all cursor-pointer active:scale-95"
              >
                <Shield size={11} className="text-[#d4af37]" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("teacher1", "password123")}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-200 transition-all cursor-pointer active:scale-95"
              >
                <UserCheck size={11} className="text-[#34d399]" />
                <span>Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("SBI0001", "password123")}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-200 transition-all cursor-pointer active:scale-95"
              >
                <GraduationCap size={11} className="text-[#6ee7b7]" />
                <span>Student</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/15 border border-red-500/40 p-3 text-xs text-red-700 dark:text-red-300 font-bold animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="staff-id" className="text-xs sm:text-sm font-bold text-white">
                {t("portal.id")}
              </label>
              <input
                id="staff-id"
                name="username"
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. admin, teacher1, or SBI0001"
                className="mt-1.5 w-full rounded-xl border border-emerald-700/60 bg-[#042f22] text-white placeholder:text-emerald-300/40 px-3.5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs sm:text-sm font-bold text-white">
                {t("portal.password")}
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-emerald-700/60 bg-[#042f22] text-white placeholder:text-emerald-300/40 px-3.5 py-3 pr-10 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-1 text-emerald-300 hover:text-white cursor-pointer transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6ee7b7] via-[#34d399] to-[#10b981] hover:from-[#a7f3d0] hover:to-[#34d399] text-[#021a12] px-4 py-3.5 text-sm font-extrabold shadow-[0_4px_20px_rgba(110,231,183,0.35)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="h-4 w-4 text-[#021a12]" />
              {loading ? "Signing in..." : t("portal.signin")}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setScreen('landing')}
            className="mt-6 inline-block text-xs sm:text-sm font-bold text-emerald-400 hover:underline cursor-pointer"
          >
            {"← " + t("portal.back")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Portal;
export { Portal };

