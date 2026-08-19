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
        const p = (password || '').trim();
        
        if (!u || !p) return false;

        // 1. Admin Match
        const admin = admins.find(a => a.username.toLowerCase() === u) || 
          (u === 'admin' || u === 'mudir' || u === 'abuki' ? { id: 'admin1', fullName: 'System Administrator', username: u } : null);
        if (admin) {
          const expectedPass = (admin as any).password || 'admin123';
          const validAdminPass = p === expectedPass || (admin as any).password === p;
          if (validAdminPass) {
            set({
              authenticated: true,
              userRole: 'admin',
              userPassword: p,
              currentUser: { id: admin.id, name: admin.fullName, username: admin.username },
              currentScreen: 'admin_dashboard'
            });
            return true;
          }
          return false;
        }

        // 2. Teacher Match
        const teacher = teachers.find(t => t.username.toLowerCase() === u) ||
          (u === 'teacher1' || u === 'teacher2' ? { id: u === 'teacher2' ? 'tch_2' : 'tch_1', fullName: u === 'teacher2' ? 'Ustadh Jaffer' : 'Ustaz Ali', username: u } : null);
        if (teacher) {
          const expectedPass = (teacher as any).password || 'password123';
          const validTeacherPass = p === expectedPass || (teacher as any).password === p;
          if (validTeacherPass) {
            set({
              authenticated: true,
              userRole: 'teacher',
              userPassword: p,
              currentUser: { id: teacher.id, name: teacher.fullName, username: teacher.username },
              currentScreen: 'teacher_dashboard'
            });
            return true;
          }
          return false;
        }

        // 3. Student Match
        const student = students.find(s => (s.registrationNumber || '').toLowerCase() === u || s.fullName.toLowerCase() === u) ||
          (u === 'student' || u === 'student1' ? { id: 'stu_1', fullName: 'Bilal Ibrahim', registrationNumber: 'SBI0001' } : null);
        if (student) {
          const expectedPass = (student as any).password || 'password123';
          const validStudentPass = p === expectedPass || (student as any).password === p;
          if (validStudentPass) {
            set({
              authenticated: true,
              userRole: 'student',
              userPassword: p,
              currentUser: { id: student.id, name: student.fullName, username: student.registrationNumber || u },
              currentScreen: 'student_dashboard'
            });
            return true;
          }
          return false;
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
      updatePassword: (newPassword) => {
        const state = useAppStore.getState();
        const dataStore = useDataStore.getState();
        const { currentUser, userRole } = state;

        if (currentUser?.id) {
          if (userRole === 'admin') {
            const admin = dataStore.admins.find(a => a.id === currentUser.id || a.username === currentUser.username);
            if (admin) {
              dataStore.updateAdmin(admin.id, { ...admin, password: newPassword });
            }
          } else if (userRole === 'teacher') {
            const teacher = dataStore.teachers.find(t => t.id === currentUser.id || t.username === currentUser.username);
            if (teacher) {
              dataStore.updateTeacher({ ...teacher, password: newPassword });
            }
          }
        }
        set({ userPassword: newPassword });
      },
    }),
    {
      name: 'al-imam-app-storage',
    }
  )
);
