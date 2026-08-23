import { create } from 'zustand';
import axios from 'axios';
import {
  Student, Teacher, Course, Payment, Salary, Attendance, Grade, TeacherAttendance, AcademicTerm, SystemAdmin, FinancialTransaction
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

export const useDataStore = create<DataState>()((set) => ({
  students: [],
  teachers: [],
  admins: [],
  courses: [],
  payments: [],
  salaries: [],
  attendance: [],
  teacherAttendance: [],
  grades: [],
  transactions: [],
  dataLoaded: false,

  fetchInitialData: async () => {
    try {
      const [adminsRes, studentsRes, teachersRes, financeRes, coursesRes, attRes, tAttRes, gradesRes] = await Promise.all([
        axios.get(`${API_URL}/admins`),
        axios.get(`${API_URL}/students`),
        axios.get(`${API_URL}/teachers`),
        axios.get(`${API_URL}/finance`),
        axios.get(`${API_URL}/courses`),
        axios.get(`${API_URL}/attendance`),
        axios.get(`${API_URL}/teacher-attendance`),
        axios.get(`${API_URL}/grades`),
      ]);
      const getData = (res: any) => {
        if (!res || !res.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
        if (res.data.data && Array.isArray(res.data.data.items)) return res.data.data.items;
        return [];
      };

      const adminsList = getData(adminsRes);
      const adminsData = adminsList.length > 0 ? adminsList : [
        { id: 'admin_1', nationalId: 'MA001', fullName: 'Master Admin', fathersName: 'Admin',
          phone: '', address: '', email: '', username: 'admin', password: 'newAdmin@123', role: 'Admin' }
      ];

      set({
        admins: adminsData,
        students: getData(studentsRes),
        teachers: getData(teachersRes),
        transactions: getData(financeRes),
        courses: getData(coursesRes),
        attendance: getData(attRes),
        teacherAttendance: getData(tAttRes),
        grades: getData(gradesRes),
        dataLoaded: true,
      });
    } catch (error) {
      console.error('Error fetching initial data (backend may be offline):', error);
      set({ dataLoaded: true }); // unblock login so UI can show error
    }
  },

  addStudent: async (student) => {
    try {
      const res = await axios.post(`${API_URL}/students`, student);
      set((state) => ({ students: [...state.students, res.data] }));
    } catch (error: any) {
      console.error('Error adding student:', error?.response?.data || error.message);
      alert(`Failed to save student: ${error?.response?.data?.error || error.message}`);
    }
  },
  updateStudent: async (updatedStudent) => {
    try {
      const res = await axios.put(`${API_URL}/students/${updatedStudent.id}`, updatedStudent);
      set((state) => ({
        students: state.students.map((s) => s.id === updatedStudent.id ? res.data : s)
      }));
    } catch (error: any) {
      console.error('Error updating student:', error?.response?.data || error.message);
    }
  },
  deleteStudent: async (id) => {
    try {
      // Optimistic UI update
      set((state) => ({ students: state.students.filter((s) => s.id !== id) }));
      // Persist deletion to backend
      await axios.delete(`${API_URL}/students/${id}`);
    } catch (error: any) {
      console.error('Error deleting student:', error?.response?.data || error.message);
    }
  },

  addTeacher: async (teacher) => {
    try {
      const res = await axios.post(`${API_URL}/teachers`, teacher);
      set((state) => ({ teachers: [...state.teachers, res.data] }));
    } catch (error: any) {
      console.error('Error adding teacher:', error?.response?.data || error.message);
      alert(`Failed to save teacher: ${error?.response?.data?.error || error.message}`);
    }
  },
  updateTeacher: async (updatedTeacher) => {
    try {
      const res = await axios.put(`${API_URL}/teachers/${updatedTeacher.id}`, updatedTeacher);
      set((state) => ({
        teachers: state.teachers.map((t) => t.id === updatedTeacher.id ? res.data : t)
      }));
    } catch (error: any) {
      console.error('Error updating teacher:', error?.response?.data || error.message);
    }
  },
  deleteTeacher: async (id) => {
    try {
      // Optimistic UI update
      set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) }));
      // Persist deletion to backend
      await axios.delete(`${API_URL}/teachers/${id}`);
    } catch (error: any) {
      console.error('Error deleting teacher:', error?.response?.data || error.message);
    }
  },

  addAdmin: (admin) => set((state) => ({ admins: [...state.admins, admin] })),
  updateAdmin: async (id, updates) => {
    try {
      const stateAdmins = useDataStore.getState().admins;
      const target = stateAdmins.find(a => a.id === id || a.username.toLowerCase() === (id || '').toLowerCase() || a.username === 'admin');
      const targetId = target?.id || id || 'admin_1';

      const res = await axios.put(`${API_URL}/admins/${targetId}`, { ...target, ...updates, id: targetId });
      const updatedData = res.data || {};
      set((state) => ({
        admins: state.admins.map((a) => (a.id === targetId || a.username === 'admin') ? { ...a, ...updatedData, password: updates.password || updatedData.password || a.password } : a)
      }));
    } catch (error: any) {
      console.error('Error updating admin:', error?.response?.data || error.message);
      set((state) => ({
        admins: state.admins.map((a) => (a.id === id || a.username === 'admin') ? { ...a, ...updates } : a)
      }));
    }
  },
  deleteAdmin: async (id) => {
    try {
      set((state) => ({ admins: state.admins.filter((a) => a.id !== id) }));
      await axios.delete(`${API_URL}/admins/${id}`);
    } catch (error: any) {
      console.error('Error deleting admin:', error?.response?.data || error.message);
    }
  },

  addCourse: async (course) => {
    try {
      const res = await axios.post(`${API_URL}/courses`, course);
      set((state) => ({ courses: [...state.courses, res.data] }));
    } catch (error: any) {
      console.error('Error adding course:', error?.response?.data || error.message);
      alert(`Failed to save course: ${error?.response?.data?.error || error.message}`);
    }
  },
  updateCourse: async (updatedCourse) => {
    try {
      const res = await axios.put(`${API_URL}/courses/${updatedCourse.id}`, updatedCourse);
      set((state) => ({
        courses: state.courses.map((c) => c.id === updatedCourse.id ? res.data : c)
      }));
    } catch (error: any) {
      console.error('Error updating course:', error?.response?.data || error.message);
    }
  },
  deleteCourse: async (id) => {
    try {
      await axios.delete(`${API_URL}/courses/${id}`);
      set((state) => ({ courses: state.courses.filter((c) => c.id !== id) }));
    } catch (error: any) {
      console.error('Error deleting course:', error?.response?.data || error.message);
    }
  },

  addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),
  addSalary: (salary) => set((state) => ({ salaries: [...state.salaries, salary] })),

  payStudentFee: async (studentId, fees, newlyPaidMonths, totalFee) => {
    try {
      const res = await axios.put(`${API_URL}/students/${studentId}/fees`, {
        fees,
        newlyPaidMonths,
        totalFee,
      });
      const { student: savedStudent, attendanceSaved } = res.data;

      set((state) => {
        // Merge updated student
        const students = state.students.map((s) =>
          s.id === studentId ? { ...s, ...savedStudent } : s
        );

        // Merge auto-created attendance records (upsert by studentId+courseId+date)
        const newKeys = new Set(
          (attendanceSaved || []).map((r: Attendance) => `${r.studentId}_${r.courseId}_${r.date}`)
        );
        const keptAtt = state.attendance.filter(
          (r) => !newKeys.has(`${r.studentId}_${r.courseId}_${r.date}`)
        );
        return {
          students,
          attendance: [...keptAtt, ...(attendanceSaved || [])],
        };
      });
    } catch (error: any) {
      console.error('Error saving fee:', error?.response?.data || error.message);
      alert(`Failed to save fee: ${error?.response?.data?.error || error.message}`);
    }
  },

  paySalary: async (teacherId, month, method) => {
    try {
      const res = await axios.put(`${API_URL}/teachers/${teacherId}/salary`, {
        month,
        status: 'Paid',
        method,
      });
      // Sync the updated teacher (with new monthlySalaries entry) into local state
      // The server returns the full updated teacher with monthlySalaries as a plain object
      set((state) => ({
        teachers: state.teachers.map((t) =>
          t.id === teacherId
            ? { ...t, ...res.data, monthlySalaries: res.data.monthlySalaries || t.monthlySalaries }
            : t
        ),
      }));
    } catch (error: any) {
      console.error('Error paying salary:', error?.response?.data || error.message);
      alert(`Failed to save salary: ${error?.response?.data?.error || error.message}`);
    }
  },

  addTransaction: async (transaction) => {
    try {
      const res = await axios.post(`${API_URL}/finance`, transaction);
      set((state) => ({ transactions: [...state.transactions, res.data] }));
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      const res = await axios.put(`${API_URL}/finance/${id}`, updates);
      set((state) => ({
        transactions: state.transactions.map((t) => t.id === id ? { ...t, ...res.data } : t)
      }));
    } catch (error: any) {
      console.error('Error updating transaction:', error?.response?.data || error.message);
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    try {
      await axios.delete(`${API_URL}/finance/${id}`);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id)
      }));
    } catch (error: any) {
      console.error('Error deleting transaction:', error?.response?.data || error.message);
      throw error;
    }
  },

  addAttendanceBatch: async (records) => {
    try {
      // Group by studentId and call the dedicated upsert sub-route per student
      const byStudent = records.reduce((acc, r) => {
        (acc[r.studentId] = acc[r.studentId] || []).push(r);
        return acc;
      }, {} as Record<string, Attendance[]>);

      const allSaved: Attendance[] = [];
      await Promise.all(
        Object.entries(byStudent).map(async ([studentId, recs]) => {
          const res = await axios.put(`${API_URL}/students/${studentId}/attendance`, { records: recs });
          allSaved.push(...res.data);
        })
      );

      // Replace existing records for the same student/course/date, then append new ones
      set((state) => {
        const savedKeys = new Set(allSaved.map((r) => `${r.studentId}_${r.courseId}_${r.date}`));
        const kept = state.attendance.filter(
          (r) => !savedKeys.has(`${r.studentId}_${r.courseId}_${r.date}`)
        );
        return { attendance: [...kept, ...allSaved] };
      });
    } catch (error: any) {
      console.error('Error saving attendance:', error?.response?.data || error.message);
      alert(`Failed to save attendance: ${error?.response?.data?.error || error.message}`);
    }
  },

  addTeacherAttendanceBatch: async (records) => {
    try {
      // Group by teacherId and call the dedicated upsert sub-route per teacher
      const byTeacher = records.reduce((acc, r) => {
        (acc[r.teacherId] = acc[r.teacherId] || []).push(r);
        return acc;
      }, {} as Record<string, TeacherAttendance[]>);

      const allSaved: TeacherAttendance[] = [];
      await Promise.all(
        Object.entries(byTeacher).map(async ([teacherId, recs]) => {
          const res = await axios.put(`${API_URL}/teachers/${teacherId}/attendance`, { records: recs });
          allSaved.push(...res.data);
        })
      );

      set((state) => {
        const savedKeys = new Set(allSaved.map((r) => `${r.teacherId}_${r.date}`));
        const kept = state.teacherAttendance.filter(
          (r) => !savedKeys.has(`${r.teacherId}_${r.date}`)
        );
        return { teacherAttendance: [...kept, ...allSaved] };
      });
    } catch (error: any) {
      console.error('Error saving teacher attendance:', error?.response?.data || error.message);
      alert(`Failed to save attendance: ${error?.response?.data?.error || error.message}`);
    }
  },
  updateGrades: async (newGrades) => {
    try {
      const res = await axios.post(`${API_URL}/grades/batch`, { records: newGrades });
      set((state) => {
        const updatedIds = res.data.map((g: Grade) => g.id);
        const keptGrades = state.grades.filter(g => !updatedIds.includes(g.id));
        return { grades: [...keptGrades, ...res.data] };
      });
    } catch (error) {
      console.error('Error updating grades:', error);
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

    return {
      students: updatedStudents,
      attendance: remainingAttendance,
      grades: remainingGrades,
    };
  })
}));
