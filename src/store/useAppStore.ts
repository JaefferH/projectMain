import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDataStore } from './useDataStore';

export type Language = 'en' | 'am' | 'ar';
export type Screen = 
  | 'landing' 
  | 'auth' 
  | 'admin_dashboard' 
  | 'admin_students' 
  | 'admin_tuition' 
  | 'admin_teachers' 
  | 'admin_finance'
  | 'admin_courses'
  | 'admin_attendance'
  | 'admin_teacher_attendance'
  | 'admin_payroll'
  | 'admin_telegram'
  | 'admin_semester_closure'
  | 'admin_roster'
  | 'teacher_dashboard'
  | 'teacher_roster'
  | 'teacher_attendance'
  | 'teacher_gradebook'
  | 'teacher_schedule'
  | 'teacher_salary'
  | 'account_settings';

export type Role = 'admin' | 'teacher' | 'student' | null;

interface User {
  id: string;
  name: string;
  username: string;
}

interface AppState {
  currentScreen: Screen;
  currentLanguage: Language;
  rtlMode: boolean;
  authenticated: boolean;
  currentUser: User | null;
  userRole: Role;
  /** Persisted password hash (plain string for local offline use) */
  userPassword: string;

  setScreen: (screen: Screen) => void;
  setLanguage: (lang: Language) => void;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  /** Update profile display name and/or username */
  updateUserProfile: (updates: Partial<Pick<User, 'name' | 'username'>>) => void;
  /** Change password — stores new password in persisted state */
  updatePassword: (newPassword: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentScreen: 'landing',
      currentLanguage: 'en',
      rtlMode: false,
      authenticated: false,
      currentUser: null,
      userRole: null,
      userPassword: '',

      setScreen: (screen) => set({ currentScreen: screen }),
      setLanguage: (lang) => set({ 
        currentLanguage: lang, 
        rtlMode: lang === 'ar' 
      }),
      login: (username, password) => {
        const { teachers, admins, students } = useDataStore.getState();
        const u = (username || '').trim().toLowerCase();
        
        // 1. Admin Match
        const admin = admins.find(a => a.username.toLowerCase() === u) || (u === 'admin' ? { id: 'admin1', fullName: 'System Administrator', username: 'admin' } : null);
        if (admin && password) {
          set({
            authenticated: true,
            userRole: 'admin',
            userPassword: password,
            currentUser: { id: admin.id, name: admin.fullName, username: admin.username },
            currentScreen: 'admin_dashboard'
          });
          return true;
        }

        // 2. Teacher Match
        const teacher = teachers.find(t => t.username.toLowerCase() === u);
        if (teacher && password) {
          set({
            authenticated: true,
            userRole: 'teacher',
            userPassword: password,
            currentUser: { id: teacher.id, name: teacher.fullName, username: teacher.username },
            currentScreen: 'teacher_dashboard'
          });
          return true;
        }

        // 3. Student Match
        const student = students.find(s => s.registrationNumber.toLowerCase() === u || s.fullName.toLowerCase().includes(u));
        if ((student || u.includes('student')) && password) {
          const sObj = student || { id: 'stu_1', fullName: 'Bilal Ibrahim', registrationNumber: 'SBI0001' };
          set({
            authenticated: true,
            userRole: 'student',
            userPassword: password,
            currentUser: { id: sObj.id, name: sObj.fullName, username: sObj.registrationNumber },
            currentScreen: 'student_dashboard'
          });
          return true;
        }

        return false;
      },
      logout: () => {
        try {
          localStorage.removeItem('al-imam-app-storage');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('currentUser');
        } catch {}
        set({ 
          authenticated: false, 
          currentUser: null, 
          userRole: null, 
          currentScreen: 'landing' 
        });
      },
      updateUserProfile: (updates) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...updates } : state.currentUser,
      })),
      updatePassword: (newPassword) => set({ userPassword: newPassword }),
    }),
    {
      name: 'al-imam-app-storage',
    }
  )
);
