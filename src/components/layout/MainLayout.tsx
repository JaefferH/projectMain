import React from 'react';
import { useAppStore, Screen } from '../../store/useAppStore';
import { t } from '../../lib/translations';
import { useTheme } from '@/lib/theme';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, BookCheck, ScrollText, 
  LogOut, Menu, X, Globe, Settings, MessageSquare, Briefcase, FileArchive, Shield, Landmark, Plus, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScripturalBanner from './ScripturalBanner';
import { ArabicCalligraphyBg, ArabicPatternBg } from '../ArabicDecoration';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { userRole, currentScreen, setScreen, logout, currentLanguage, rtlMode, setLanguage, currentUser } = useAppStore();
  const { theme, toggle: toggleTheme } = useTheme();
  
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [sidebarOpen, setSidebarOpen] = React.useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (screenId: Screen) => {
    setScreen(screenId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const isDark = theme === 'dark';

  const adminMenu = [
    { id: 'admin_dashboard', icon: LayoutDashboard, label: t('dashboard', currentLanguage) },
    { id: 'admin_students', icon: Users, label: 'Student Enrollments & Guardians' },
    { id: 'admin_teachers', icon: Briefcase, label: 'Faculty & Employee Profiles' },
    { id: 'admin_teacher_attendance', icon: BookCheck, label: 'Teacher Attendance Audit' },
    { id: 'admin_finance', icon: Landmark, label: 'Institute Finance & Ledger' },
    { id: 'admin_courses', icon: BookOpen, label: 'Academic Courses & Classes' },
    { id: 'admin_telegram', icon: MessageSquare, label: 'Telegram Communication Gateway' },
    { id: 'admin_semester_closure', icon: FileArchive, label: 'Academic Term Closure' },
    { id: 'admin_roster', icon: Shield, label: 'System Admins & Users' },
  ];

  const teacherMenu = [
    { id: 'teacher_dashboard', icon: LayoutDashboard, label: t('dashboard', currentLanguage) },
    { id: 'teacher_roster', icon: Users, label: 'Class Enrollments & Guardians' },
    { id: 'teacher_attendance', icon: BookCheck, label: 'Student Attendance Register' },
    { id: 'teacher_gradebook', icon: GraduationCap, label: 'Assessments & Gradebook' },
    { id: 'teacher_schedule', icon: Calendar, label: 'Teaching Schedule & Timetable' },
    { id: 'teacher_salary', icon: ScrollText, label: 'Personal Salary Ledger' },
  ];

  const studentMenu = [
    { id: 'student_dashboard', icon: LayoutDashboard, label: t('dashboard', currentLanguage) },
    { id: 'student_grades', icon: GraduationCap, label: 'My Grades & Assessment Report' },
    { id: 'student_attendance', icon: BookCheck, label: 'My Attendance Register' },
    { id: 'student_timetable', icon: Calendar, label: 'Class Schedule & Timetable' },
    { id: 'student_fees', icon: Landmark, label: 'Tuition Fee Ledger' },
  ];

  const roleKey = (userRole || 'admin').toLowerCase();
  const menuItems = roleKey.includes('admin') ? adminMenu : roleKey.includes('teacher') ? teacherMenu : studentMenu;

  const settingsLabel = currentLanguage === 'ar' ? 'إعدادات الحساب' : currentLanguage === 'am' ? 'የሒሳብ ቅንብሮች' : 'Account Settings';

  return (
    <div
      className={`flex h-screen overflow-hidden ${rtlMode ? 'font-arabic' : 'font-sans'} relative ${isDark ? 'bg-[#021a12] text-white' : 'bg-[#edf9f3] text-[#042c22]'}`}
    >
      {/* ── Global Background: Responsive Light/Dark Mode ── */}
      <div className={`absolute inset-0 z-0 ${isDark ? 'bg-[#021a12]' : 'bg-[#edf9f3]'}`}>
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${isDark ? 'opacity-20' : 'opacity-10'}`}
          style={{ backgroundImage: 'url("/5877690125452512689_120.jpg")' }}
        />
        {/* Dark / Light green overlay */}
        <div className={`absolute inset-0 ${isDark ? 'bg-[#021a12]/80' : 'bg-[#edf9f3]/90'} backdrop-blur-md`} />
        {/* Arabic Calligraphy Watermarks Overlay */}
        <ArabicCalligraphyBg density="medium" />
        {/* Islamic Star Grid Pattern Overlay */}
        <ArabicPatternBg />
        {/* Subtle vignette for depth */}
        <div className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(ellipse_at_50%_0%,transparent_40%,rgba(2,15,10,0.85)_100%)]' : 'bg-[radial-gradient(ellipse_at_50%_0%,transparent_40%,rgba(220,245,232,0.85)_100%)]'}`} />
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`${isMobile ? 'fixed top-0 bottom-0 left-0 z-40 shadow-2xl' : 'relative z-20'} flex flex-col shrink-0 glass-sidebar overflow-hidden ${rtlMode ? (isMobile ? 'left-auto right-0' : 'order-last border-r-0 border-l border-l-[#d4af37]/25') : ''}`}
          >
            {/* Arabic Calligraphy Watermark in Sidebar */}
            <ArabicCalligraphyBg density="heavy" />

            {/* Gold top-border shimmer accent */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent z-10" />

            {/* Logo Area */}
            <div className="h-20 flex items-center justify-between border-b border-[#d4af37]/20 shrink-0 px-4">
              <h1 className="text-[#d4af37] font-bold leading-tight truncate px-2 text-sm md:text-base font-arabic drop-shadow-md">
                {t('title', currentLanguage)}
              </h1>
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-emerald-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Navigation Menu Items */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id as Screen)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left ${
                      isActive
                        ? 'btn-gold font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02] text-white'
                        : isDark
                        ? 'text-emerald-100/90 hover:bg-white/10 hover:text-white hover:translate-x-1'
                        : 'text-[#047857] hover:bg-emerald-100/60 hover:text-[#042c22] hover:translate-x-1'
                    }`}
                  >
                    <Icon size={19} className={isActive ? 'text-[#042c22]' : 'text-[#d4af37] shrink-0'} />
                    <span className="text-xs md:text-sm font-medium tracking-wide leading-snug">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom: Account Settings + Logout */}
            <div className="p-4 border-t border-[#d4af37]/20 space-y-2">
              {/* Account Settings */}
              <button
                onClick={() => handleNavClick('account_settings')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  currentScreen === 'account_settings'
                    ? 'bg-gradient-to-r from-[#10b981] to-[#047857] text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.02]'
                    : isDark
                    ? 'text-[#6ee7b7] hover:bg-[#10b981]/20 hover:text-[#34d399] hover:translate-x-1 font-bold'
                    : 'text-[#047857] hover:bg-emerald-100 hover:text-[#042c22] hover:translate-x-1 font-bold'
                }`}
              >
                <Settings size={18} className={currentScreen === 'account_settings' ? 'text-white' : 'text-[#10b981] dark:text-[#6ee7b7]'} />
                <span className="text-xs font-extrabold text-[#047857] dark:text-[#6ee7b7]">{settingsLabel}</span>
              </button>

              {/* User identity chip */}
              <div className="flex items-center gap-3 px-3 py-2 bg-black/20 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-xs shrink-0">
                  {(currentUser?.name?.[0] || (userRole === 'admin' ? 'A' : 'T')).toUpperCase()}
                </div>
                <span className="text-white/60 text-xs font-medium truncate">{currentUser?.name || 'Authorized User'}</span>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/15 transition-all text-xs font-bold cursor-pointer border border-red-500/20"
              >
                <LogOut size={18} />
                <span>{t('logout', currentLanguage)}</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ──────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">

        {/* Header (Sticky Top Navbar) */}
        <header
          className="h-20 flex items-center justify-between px-6 shrink-0 z-10 glass-navbar"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold shadow-[0_0_15px_rgba(212,175,55,0.25)]">
                <Landmark size={20} className="text-[#d4af37]" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-base font-extrabold leading-tight font-arabic drop-shadow-sm text-[#d4af37] gold-title">
                  {t('title', currentLanguage)}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="gold-badge px-2 py-0.5 rounded-full text-[10px]">Academic Year 2025/2026</span>
                  <span className="emerald-badge px-2 py-0.5 rounded-full text-[10px]">Semester 1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: Register Student */}
            {userRole === 'admin' && (
              <button
                onClick={() => setScreen('admin_students')}
                className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 transition-all cursor-pointer border border-emerald-400/30"
              >
                <Plus size={16} />
                <span>Register Student</span>
              </button>
            )}

            {/* Day / Night Mode Theme Toggle Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isDark
                  ? 'border-[#6ee7b7]/40 bg-[#042f22]/80 text-[#6ee7b7] hover:bg-[#10b981]/20'
                  : 'border-emerald-500/40 bg-white text-[#047857] hover:bg-emerald-50'
              }`}
            >
              {isDark ? <Sun size={15} className="text-[#6ee7b7]" /> : <Moon size={15} className="text-[#047857]" />}
              <span className="hidden sm:inline">{isDark ? '☀ Light' : '☾ Dark'}</span>
            </button>

            {/* Language Switcher */}
            <div
              className="hidden md:flex items-center rounded-xl p-1 gap-0.5 border border-white/15 bg-black/20 backdrop-blur-md"
            >
              <Globe size={14} className="mx-2 text-[#d4af37]" />
              {(['en', 'am', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all font-bold ${
                    currentLanguage === lang
                      ? 'bg-[#d4af37] text-[#064e3b] shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* User Role Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1 ${
              userRole === 'admin' ? 'gold-badge' : userRole === 'teacher' ? 'emerald-badge' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            }`}>
              <Shield size={12} />
              {userRole}
            </span>

            {/* User Avatar */}
            <div 
              onClick={() => setScreen('account_settings')}
              className="w-10 h-10 rounded-xl bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold border border-[#d4af37]/40 shadow-sm text-sm cursor-pointer hover:border-[#d4af37] transition-all"
              title="Account Settings"
            >
              {(currentUser?.name?.[0] || (userRole === 'admin' ? 'A' : 'T')).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-5">
            {/* ── Scriptural Banner: shown on ALL authenticated screens ── */}
            <ScripturalBanner />

            {/* Child content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              key={currentScreen}
            >
              {children}
            </motion.div>
          </div>

          {/* Portal Footer */}
          <footer className="mt-10 pb-4 text-center opacity-30">
            <p className="text-white/60 text-[10px] tracking-wider font-semibold">
              Al Imam Hassan Mosque &amp; Madrasah • System Portal
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
