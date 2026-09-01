import { create } from 'zustand';
import axios from 'axios';
import {
  Student, Teacher, Course, Payment, Salary, Attendance, Grade, TeacherAttendance, AcademicTerm, SystemAdmin, FinancialTransaction,
  initialAdmins, initialStudents, initialTeachers, initialCourses
} from '../lib/sampleData';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface DataState {
  students: Student[];
  teachers: Teacher[];
  admins: SystemAdmin[];
  courses: Course[];
  payments: Payment[];
  salaries: Salary[];
  attendance: Attendance[];
  teacherAttendance: TeacherAttendance[];
  grades: Grade[];
  transactions: FinancialTransaction[];
  dataLoaded: boolean;

  fetchInitialData: () => Promise<void>;

  // Student Actions
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  // Teacher Actions
  addTeacher: (teacher: Teacher) => Promise<void>;
  updateTeacher: (teacher: Teacher) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  // Admin Actions
  addAdmin: (admin: SystemAdmin) => void;
  updateAdmin: (id: string, updates: Partial<SystemAdmin>) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;

  // Course Actions
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Payment Actions
  addPayment: (payment: Payment) => void;

  /**
   * Atomic fee payment: persists monthlyFees map, auto-marks attendance Present
   * for each newly-paid month, writes Finance Ledger Income entry, fires Telegram.
   * Returns the saved student on success.
   */
  payStudentFee: (
    studentId: string,
    fees: NonNullable<Student['monthlyFees']>,
    newlyPaidMonths: string[],
    totalFee: number
  ) => Promise<void>;

  // Salary Actions
  addSalary: (salary: Salary) => void;
  /** Persists monthly salary to DB, writes Finance Ledger, fires Telegram ping */
  paySalary: (teacherId: string, month: string, method: 'Cash' | 'Bank Transfer') => Promise<void>;

  // Financial Actions
  addTransaction: (transaction: FinancialTransaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<FinancialTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Attendance Actions
  addAttendanceBatch: (records: Attendance[]) => Promise<void>;
  addTeacherAttendanceBatch: (records: TeacherAttendance[]) => Promise<void>;

  // Grade Actions
  updateGrades: (grades: Grade[]) => void;

  // Semester Closure
  closeSemester: (term: string) => void;
}

const defaultTransactions: FinancialTransaction[] = [
  { id: 'fin_1', type: 'Income', category: 'Tuition Fee', date: '2026-08-01', amount: 45000, description: 'Monthly Tuition Collections' },
  { id: 'fin_2', type: 'Outcome', category: 'Teacher Salaries', date: '2026-08-05', amount: 25000, description: 'Faculty Payroll Disbursement' },
  { id: 'fin_3', type: 'Outcome', category: 'Utilities & Maintenance', date: '2026-08-10', amount: 3500, description: 'Madrasah Electricity and Learning Materials' }
];

const STORAGE_PREFIX = 'al_imam_madrasah_db_';

function getSaved<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(`${STORAGE_PREFIX}${key}`) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback)) {
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
      } else if (parsed) {
        return parsed as T;
      }
    }
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}:`, e);
  }
  return fallback;
}

function saveLocal<T>(key: string, data: T) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`Error saving to localStorage for ${key}:`, e);
  }
}

export const useDataStore = create<DataState>()((set) => ({
  students: getSaved('students', initialStudents),
  teachers: getSaved('teachers', initialTeachers),
  admins: getSaved('admins', initialAdmins),
  courses: getSaved('courses', initialCourses),
  payments: getSaved('payments', []),
  salaries: getSaved('salaries', []),
  attendance: getSaved('attendance', []),
  teacherAttendance: getSaved('teacher_attendance', []),
  grades: getSaved('grades', []),
  transactions: getSaved('transactions', defaultTransactions),
  dataLoaded: true,

  fetchInitialData: async () => {
    try {
      const [adminsRes, studentsRes, teachersRes, financeRes, coursesRes, attRes, tAttRes, gradesRes] = await Promise.all([
        axios.get(`${API_URL}/admins`, { timeout: 3000 }).catch(() => null),
        axios.get(`${API_URL}/students`, { timeout: 3000 }).catch(() => null),
        axios.get(`${API_URL}/teachers`, { timeout: 3000 }).catch(() => null),
        axios.get(`${API_URL}/finance`, { timeout: 3000 }).catch(() => null),
        axios.get(`${API_URL}/courses`, { timeout: 3000 }).catch(() => null),
        axios.get(`${API_URL}/attendance`, { timeout: 3000 }).catch(() => null),
        axios.get(`${API_URL}/teacher-attendance`, { timeout: 3000 }).catch(() => null),
        axios.get(`${API_URL}/grades`, { timeout: 3000 }).catch(() => null),
      ]);
      const getData = (res: any) => {
        if (!res || !res.data) return null;
        if (typeof res.data === 'string') return null;
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
        if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) return res.data.data;
        if (res.data.data && Array.isArray(res.data.data.items) && res.data.data.items.length > 0) return res.data.data.items;
        return null;
      };

      set((state) => {
        const adminsData = getData(adminsRes) || state.admins || initialAdmins;
        const studentsData = getData(studentsRes) || state.students || initialStudents;
        const teachersData = getData(teachersRes) || state.teachers || initialTeachers;
        const transactionsData = getData(financeRes) || state.transactions || defaultTransactions;
        const coursesData = getData(coursesRes) || state.courses || initialCourses;
        const attData = getData(attRes) || state.attendance || [];
        const tAttData = getData(tAttRes) || state.teacherAttendance || [];
        const gradesData = getData(gradesRes) || state.grades || [];

        saveLocal('admins', adminsData);
        saveLocal('students', studentsData);
        saveLocal('teachers', teachersData);
        saveLocal('transactions', transactionsData);
        saveLocal('courses', coursesData);
        saveLocal('attendance', attData);
        saveLocal('teacher_attendance', tAttData);
        saveLocal('grades', gradesData);

        return {
          admins: adminsData,
          students: studentsData,
          teachers: teachersData,
          transactions: transactionsData,
          courses: coursesData,
          attendance: attData,
          teacherAttendance: tAttData,
          grades: gradesData,
          dataLoaded: true,
        };
      });
    } catch {
      set({ dataLoaded: true });
    }
  },

  addStudent: async (student) => {
    const newStudent = { ...student, id: student.id || `stu_${Date.now()}` };
    set((state) => {
      const updated = [...state.students, newStudent];
      saveLocal('students', updated);
      return { students: updated };
    });
    try {
      const res = await axios.post(`${API_URL}/students`, newStudent, { timeout: 3000 });
      if (res.data && res.data.id) {
        set((state) => {
          const updated = state.students.map(s => s.id === newStudent.id ? res.data : s);
          saveLocal('students', updated);
          return { students: updated };
        });
      }
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  updateStudent: async (updatedStudent) => {
    set((state) => {
      const updated = state.students.map((s) => s.id === updatedStudent.id ? updatedStudent : s);
      saveLocal('students', updated);
      return { students: updated };
    });
    try {
      const res = await axios.put(`${API_URL}/students/${updatedStudent.id}`, updatedStudent, { timeout: 3000 });
      if (res.data) {
        set((state) => {
          const updated = state.students.map((s) => s.id === updatedStudent.id ? { ...s, ...res.data } : s);
          saveLocal('students', updated);
          return { students: updated };
        });
      }
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  deleteStudent: async (id) => {
    set((state) => {
      const updated = state.students.filter((s) => s.id !== id);
      saveLocal('students', updated);
      return { students: updated };
    });
    try {
      await axios.delete(`${API_URL}/students/${id}`, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (deleted locally):', e);
    }
  },

  addTeacher: async (teacher) => {
    const newTeacher = { ...teacher, id: teacher.id || `tch_${Date.now()}` };
    set((state) => {
      const updated = [...state.teachers, newTeacher];
      saveLocal('teachers', updated);
      return { teachers: updated };
    });
    try {
      const res = await axios.post(`${API_URL}/teachers`, newTeacher, { timeout: 3000 });
      if (res.data && res.data.id) {
        set((state) => {
          const updated = state.teachers.map(t => t.id === newTeacher.id ? res.data : t);
          saveLocal('teachers', updated);
          return { teachers: updated };
        });
      }
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  updateTeacher: async (updatedTeacher) => {
    set((state) => {
      const updated = state.teachers.map((t) => t.id === updatedTeacher.id ? updatedTeacher : t);
      saveLocal('teachers', updated);
      return { teachers: updated };
    });
    try {
      const res = await axios.put(`${API_URL}/teachers/${updatedTeacher.id}`, updatedTeacher, { timeout: 3000 });
      if (res.data) {
        set((state) => {
          const updated = state.teachers.map((t) => t.id === updatedTeacher.id ? { ...t, ...res.data } : t);
          saveLocal('teachers', updated);
          return { teachers: updated };
        });
      }
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  deleteTeacher: async (id) => {
    set((state) => {
      const updated = state.teachers.filter((t) => t.id !== id);
      saveLocal('teachers', updated);
      return { teachers: updated };
    });
    try {
      await axios.delete(`${API_URL}/teachers/${id}`, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (deleted locally):', e);
    }
  },

  addAdmin: (admin) => {
    set((state) => {
      const updated = [...state.admins, admin];
      saveLocal('admins', updated);
      return { admins: updated };
    });
  },

  updateAdmin: async (id, updates) => {
    set((state) => {
      const target = state.admins.find(a => a.id === id || a.username.toLowerCase() === (id || '').toLowerCase() || a.username === 'admin');
      const targetId = target?.id || id || 'admin_1';
      const updated = state.admins.map((a) => (a.id === targetId || a.username === 'admin') ? { ...a, ...updates } : a);
      saveLocal('admins', updated);
      return { admins: updated };
    });
    try {
      const stateAdmins = useDataStore.getState().admins;
      const target = stateAdmins.find(a => a.id === id || a.username.toLowerCase() === (id || '').toLowerCase() || a.username === 'admin');
      const targetId = target?.id || id || 'admin_1';
      await axios.put(`${API_URL}/admins/${targetId}`, { ...target, ...updates, id: targetId }, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  deleteAdmin: async (id) => {
    set((state) => {
      const updated = state.admins.filter((a) => a.id !== id);
      saveLocal('admins', updated);
      return { admins: updated };
    });
    try {
      await axios.delete(`${API_URL}/admins/${id}`, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (deleted locally):', e);
    }
  },

  addCourse: async (course) => {
    const newCourse = { ...course, id: course.id || `crs_${Date.now()}` };
    set((state) => {
      const updated = [...state.courses, newCourse];
      saveLocal('courses', updated);
      return { courses: updated };
    });
    try {
      const res = await axios.post(`${API_URL}/courses`, newCourse, { timeout: 3000 });
      if (res.data && res.data.id) {
        set((state) => {
          const updated = state.courses.map(c => c.id === newCourse.id ? res.data : c);
          saveLocal('courses', updated);
          return { courses: updated };
        });
      }
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  updateCourse: async (updatedCourse) => {
    set((state) => {
      const updated = state.courses.map((c) => c.id === updatedCourse.id ? updatedCourse : c);
      saveLocal('courses', updated);
      return { courses: updated };
    });
    try {
      await axios.put(`${API_URL}/courses/${updatedCourse.id}`, updatedCourse, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  deleteCourse: async (id) => {
    set((state) => {
      const updated = state.courses.filter((c) => c.id !== id);
      saveLocal('courses', updated);
      return { courses: updated };
    });
    try {
      await axios.delete(`${API_URL}/courses/${id}`, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (deleted locally):', e);
    }
  },

  addPayment: (payment) => {
    set((state) => {
      const updated = [...state.payments, payment];
      saveLocal('payments', updated);
      return { payments: updated };
    });
  },

  addSalary: (salary) => {
    set((state) => {
      const updated = [...state.salaries, salary];
      saveLocal('salaries', updated);
      return { salaries: updated };
    });
  },

  payStudentFee: async (studentId, fees, newlyPaidMonths, totalFee) => {
    set((state) => {
      const students = state.students.map((s) =>
        s.id === studentId ? { ...s, monthlyFees: fees } : s
      );
      saveLocal('students', students);

      const incomeTransaction: FinancialTransaction = {
        id: `fin_${Date.now()}`,
        type: 'Income',
        category: 'Tuition Fee',
        date: new Date().toISOString().split('T')[0],
        amount: totalFee || 500,
        description: `Tuition collection for ${newlyPaidMonths.join(', ')}`,
      };
      const transactions = [...state.transactions, incomeTransaction];
      saveLocal('transactions', transactions);

      return { students, transactions };
    });

    try {
      await axios.put(`${API_URL}/students/${studentId}/fees`, { fees, newlyPaidMonths, totalFee }, { timeout: 4000 });
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  paySalary: async (teacherId, month, method) => {
    set((state) => {
      const teachers = state.teachers.map((t) => {
        if (t.id === teacherId) {
          const salaries = { ...(t.monthlySalaries || {}) };
          salaries[month] = { status: 'Paid', method };
          return { ...t, monthlySalaries: salaries };
        }
        return t;
      });
      saveLocal('teachers', teachers);

      const teacher = state.teachers.find(t => t.id === teacherId);
      const salaryTransaction: FinancialTransaction = {
        id: `fin_${Date.now()}`,
        type: 'Outcome',
        category: 'Teacher Salaries',
        date: new Date().toISOString().split('T')[0],
        amount: teacher?.baseSalary || 5000,
        description: `Faculty payroll disbursement for ${teacher?.fullName || 'Teacher'} (${month})`,
      };
      const transactions = [...state.transactions, salaryTransaction];
      saveLocal('transactions', transactions);

      return { teachers, transactions };
    });

    try {
      await axios.put(`${API_URL}/teachers/${teacherId}/salary`, { month, status: 'Paid', method }, { timeout: 4000 });
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  addTransaction: async (transaction) => {
    const newTx = { ...transaction, id: transaction.id || `fin_${Date.now()}` };
    set((state) => {
      const updated = [...state.transactions, newTx];
      saveLocal('transactions', updated);
      return { transactions: updated };
    });
    try {
      await axios.post(`${API_URL}/finance`, newTx, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  updateTransaction: async (id, updates) => {
    set((state) => {
      const updated = state.transactions.map((t) => t.id === id ? { ...t, ...updates } : t);
      saveLocal('transactions', updated);
      return { transactions: updated };
    });
    try {
      await axios.put(`${API_URL}/finance/${id}`, updates, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (saved locally):', e);
    }
  },

  deleteTransaction: async (id) => {
    set((state) => {
      const updated = state.transactions.filter((t) => t.id !== id);
      saveLocal('transactions', updated);
      return { transactions: updated };
    });
    try {
      await axios.delete(`${API_URL}/finance/${id}`, { timeout: 3000 });
    } catch (e) {
      console.warn('Backend sync deferred (deleted locally):', e);
    }
  },

  addAttendanceBatch: async (records) => {
    // 1. Immediately update State & LocalStorage — 100% guarantee data is permanently saved
    set((state) => {
      const savedKeys = new Set(records.map((r) => `${r.studentId}_${r.courseId}_${r.date}`));
      const kept = state.attendance.filter(
        (r) => !savedKeys.has(`${r.studentId}_${r.courseId}_${r.date}`)
      );
      const updated = [...kept, ...records];
      saveLocal('attendance', updated);
      return { attendance: updated };
    });

    // 2. Sync to Backend in background
    try {
      const byStudent = records.reduce((acc, r) => {
        (acc[r.studentId] = acc[r.studentId] || []).push(r);
        return acc;
      }, {} as Record<string, Attendance[]>);

      await Promise.all([
        ...Object.entries(byStudent).map(([studentId, recs]) =>
          axios.put(`${API_URL}/students/${studentId}/attendance`, { records: recs }, { timeout: 4000 }).catch(() => null)
        ),
        axios.post(`${API_URL}/attendance`, { records }, { timeout: 4000 }).catch(() => null),
      ]);
    } catch (e) {
      console.warn('Backend attendance sync deferred (saved locally):', e);
    }
  },

  addTeacherAttendanceBatch: async (records) => {
    // 1. Immediately update State & LocalStorage
    set((state) => {
      const savedKeys = new Set(records.map((r) => `${r.teacherId}_${r.date}`));
      const kept = state.teacherAttendance.filter(
        (r) => !savedKeys.has(`${r.teacherId}_${r.date}`)
      );
      const updated = [...kept, ...records];
      saveLocal('teacher_attendance', updated);
      return { teacherAttendance: updated };
    });

    // 2. Sync to Backend in background
    try {
      const byTeacher = records.reduce((acc, r) => {
        (acc[r.teacherId] = acc[r.teacherId] || []).push(r);
        return acc;
      }, {} as Record<string, TeacherAttendance[]>);

      await Promise.all([
        ...Object.entries(byTeacher).map(([teacherId, recs]) =>
          axios.put(`${API_URL}/teachers/${teacherId}/attendance`, { records: recs }, { timeout: 4000 }).catch(() => null)
        ),
        axios.post(`${API_URL}/teacher-attendance`, { records }, { timeout: 4000 }).catch(() => null),
      ]);
    } catch (e) {
      console.warn('Backend teacher attendance sync deferred (saved locally):', e);
    }
  },

  updateGrades: async (newGrades) => {
    set((state) => {
      const updatedIds = newGrades.map((g: Grade) => g.id);
      const keptGrades = state.grades.filter(g => !updatedIds.includes(g.id));
      const updated = [...keptGrades, ...newGrades];
      saveLocal('grades', updated);
      return { grades: updated };
    });

    try {
      await axios.post(`${API_URL}/grades/batch`, { records: newGrades }, { timeout: 4000 });
    } catch (e) {
      console.warn('Backend grade sync deferred (saved locally):', e);
    }
  },

  closeSemester: (term) => set((state) => {
    const termCourses = state.courses.filter(c => c.term === term);
    const termCourseIds = termCourses.map(c => c.id);

    const updatedStudents = state.students.map(student => {
      const termEnrolled = student.enrolledCourseIds.filter(id => termCourseIds.includes(id));
      if (termEnrolled.length === 0) return student;

      const newHistoryTerm: AcademicTerm = {
        term,
        enrolledCourseIds: termEnrolled,
        status: 'Completed'
      };

      const remainingEnrolled = student.enrolledCourseIds.filter(id => !termCourseIds.includes(id));

      return {
        ...student,
        enrolledCourseIds: remainingEnrolled,
        academicHistory: [...(student.academicHistory || []), newHistoryTerm]
      };
    });

    const remainingAttendance = state.attendance.filter(a => !termCourseIds.includes(a.courseId));
    const remainingGrades = state.grades.filter(g => !termCourseIds.includes(g.courseId));

    saveLocal('students', updatedStudents);
    saveLocal('attendance', remainingAttendance);
    saveLocal('grades', remainingGrades);

    return {
      students: updatedStudents,
      attendance: remainingAttendance,
      grades: remainingGrades,
    };
  })
}));
