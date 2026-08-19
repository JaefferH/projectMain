import { useEffect, useRef } from 'react';
import { useAppStore } from './store/useAppStore';
import { useDataStore } from './store/useDataStore';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import MainLayout from './components/layout/MainLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentLedgerHub from './pages/admin/StudentLedgerHub';
import TeacherLedgerHub from './pages/admin/TeacherLedgerHub';
import InstituteFinanceTracker from './pages/admin/InstituteFinanceTracker';
import CourseManagement from './pages/admin/CourseManagement';
import TelegramHub from './pages/admin/TelegramHub';
import SemesterClosure from './pages/admin/SemesterClosure';
import AdminRoster from './pages/admin/AdminRoster';
import TeacherAttendancePage from './pages/admin/TeacherAttendancePage';
import StudentRoster from './pages/teacher/StudentRoster';
import AttendanceSystem from './pages/teacher/AttendanceSystem';
import Gradebook from './pages/teacher/Gradebook';
import MySchedule from './pages/teacher/MySchedule';
import MySalaryLedger from './pages/teacher/MySalaryLedger';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentFees from './pages/student/StudentFees';
import AccountSettings from './pages/AccountSettings';

const ADMIN_SCREENS = ['admin_dashboard', 'admin_students', 'admin_teachers', 'admin_teacher_attendance', 'admin_finance', 'admin_courses', 'admin_telegram', 'admin_semester_closure', 'admin_roster', 'account_settings'];
const TEACHER_SCREENS = ['teacher_dashboard', 'teacher_roster', 'teacher_attendance', 'teacher_gradebook', 'teacher_schedule', 'teacher_salary', 'account_settings'];
const STUDENT_SCREENS = ['student_dashboard', 'student_grades', 'student_attendance', 'student_timetable', 'student_fees', 'account_settings'];

const PORTAL_URL = 'http://localhost:8080/portal';

// Read auth state DIRECTLY from localStorage — bypasses Zustand hydration timing
function getStoredAuth(): { authenticated: boolean; role: string; screen: string; user: { id: string; name: string; username: string } | null } {
  // First check if the portal passed auth via URL param (?auth=...)
  // This is needed because localStorage is per-origin (port 8080 ≠ port 5173)
  try {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    if (authParam) {
      const appState = JSON.parse(atob(authParam));
      // Store it in THIS origin's localStorage so refresh works too
      localStorage.setItem('al-imam-app-storage', JSON.stringify(appState));
      // Clean the URL (remove the ?auth= part)
      window.history.replaceState({}, document.title, window.location.pathname);
      const state = appState?.state;
      if (state?.authenticated) {
        return {
          authenticated: true,
          role: state.userRole ?? 'admin',
          screen: state.currentScreen ?? 'admin_dashboard',
          user: state.currentUser ?? null,
        };
      }
    }
  } catch { /* ignore */ }

  // Fallback: read from this origin's localStorage (for refreshes)
  try {
    const raw = localStorage.getItem('al-imam-app-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (state?.authenticated === true) {
        return {
          authenticated: true,
          role: state.userRole ?? 'admin',
          screen: state.currentScreen ?? 'admin_dashboard',
          user: state.currentUser ?? null,
        };
      }
    }
  } catch { /* ignore */ }

  return { authenticated: false, role: 'admin', screen: 'admin_dashboard', user: null };
}

const Spinner = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#064e3b' }}>
    <div style={{ textAlign: 'center', color: '#d4af37' }}>
      <div style={{ width: 48, height: 48, border: '4px solid #d4af37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <p style={{ fontFamily: 'sans-serif', fontSize: 14 }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

import Home from './routes/index';
import About from './routes/about';
import Programs from './routes/programs';
import Contact from './routes/contact';
import Faq from './routes/faq';
import Portal from './routes/portal';

function App() {
  const { currentScreen, currentLanguage, rtlMode, userRole, authenticated } = useAppStore();
  const fetchInitialData = useDataStore(state => state.fetchInitialData);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    // Handle direct URL path navigation (e.g. /portal, /auth, /login)
    const path = window.location.pathname.toLowerCase();
    const hasToken = localStorage.getItem('accessToken');
    const isAuth = useAppStore.getState().authenticated;

    if (path.includes('/portal') || path.includes('/auth') || path.includes('/login')) {
      if (!isAuth && !hasToken) {
        useAppStore.setState({ authenticated: false, currentScreen: 'auth' });
      }
    } else if (!hasToken && !isAuth) {
      useAppStore.setState({ authenticated: false, currentScreen: 'landing' });
    }

    // Fetch initial backend data for data store
    fetchInitialData();
  }, []);

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = rtlMode ? 'rtl' : 'ltr';
    if (rtlMode) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [currentLanguage, rtlMode]);

  // Public Website Pages & Staff Portal
  const PUBLIC_PAGES = ['landing', 'auth', 'about', 'programs', 'contact', 'faq'];
  const isPublicPage = PUBLIC_PAGES.includes(currentScreen);

  if (!authenticated || isPublicPage) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          {currentScreen === 'auth' && <Portal />}
          {currentScreen === 'about' && <About />}
          {currentScreen === 'programs' && <Programs />}
          {currentScreen === 'contact' && <Contact />}
          {currentScreen === 'faq' && <Faq />}
          {(currentScreen === 'landing' || (isPublicPage && currentScreen !== 'auth' && currentScreen !== 'about' && currentScreen !== 'programs' && currentScreen !== 'contact' && currentScreen !== 'faq')) && <Home />}
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  const roleKey = (userRole || 'admin').toLowerCase();
  const isAdmin = roleKey.includes('admin');
  const isTeacher = roleKey.includes('teacher');

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen font-sans">
          <MainLayout>
            {isAdmin ? (
              <>
                {currentScreen === 'admin_dashboard'  && <AdminDashboard />}
                {currentScreen === 'admin_students'   && <StudentLedgerHub />}
                {currentScreen === 'admin_teachers'   && <TeacherLedgerHub />}
                {currentScreen === 'admin_finance'    && <InstituteFinanceTracker />}
                {currentScreen === 'admin_courses'    && <CourseManagement />}
                {currentScreen === 'admin_teacher_attendance' && <TeacherAttendancePage />}
                {currentScreen === 'admin_telegram'   && <TelegramHub />}
                {currentScreen === 'admin_semester_closure' && <SemesterClosure />}
                {currentScreen === 'admin_roster'     && <AdminRoster />}
                {currentScreen === 'account_settings' && <AccountSettings />}
                {!ADMIN_SCREENS.includes(currentScreen) && <AdminDashboard />}
              </>
            ) : isTeacher ? (
              <>
                {currentScreen === 'teacher_dashboard'  && <TeacherDashboard />}
                {currentScreen === 'teacher_roster'     && <StudentRoster />}
                {currentScreen === 'teacher_attendance' && <AttendanceSystem />}
                {currentScreen === 'teacher_gradebook'  && <Gradebook />}
                {currentScreen === 'teacher_schedule'   && <MySchedule />}
                {currentScreen === 'teacher_salary'     && <MySalaryLedger />}
                {currentScreen === 'account_settings'   && <AccountSettings />}
                {!TEACHER_SCREENS.includes(currentScreen) && <TeacherDashboard />}
              </>
            ) : (
              <>
                {currentScreen === 'student_dashboard'  && <StudentDashboard />}
                {currentScreen === 'student_grades'     && <StudentGrades />}
                {currentScreen === 'student_attendance' && <StudentAttendance />}
                {currentScreen === 'student_timetable'  && <StudentTimetable />}
                {currentScreen === 'student_fees'       && <StudentFees />}
                {currentScreen === 'account_settings'   && <AccountSettings />}
                {!STUDENT_SCREENS.includes(currentScreen) && <StudentDashboard />}
              </>
            )}
          </MainLayout>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
