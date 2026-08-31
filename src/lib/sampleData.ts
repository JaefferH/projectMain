export interface AcademicTerm {
  term: string; // e.g., 'Summer 2026', 'Winter 2026'
  enrolledCourseIds: string[];
  status: 'Active' | 'Completed' | 'Dropped';
}

export interface Student {
  id: string;
  fullName: string;
  fathersName: string;
  phone: string;
  address: string;
  mothersName?: string;
  registrationNumber: string;
  enrolledCourseIds: string[];
  academicHistory: AcademicTerm[];
  photoUrl?: string;
  telegramChatId?: string;
  totalFee: number;
  amountPaid: number;
  password?: string;
  monthlyFees?: Record<string, { status: 'Paid' | 'Unpaid', method?: 'Cash' | 'Bank Transfer' }>; // e.g. { 'September': { status: 'Paid', method: 'Cash' } }
}

export interface Teacher {
  id: string;
  fullName: string;
  fathersName: string;
  mothersName?: string;
  contact: string;
  nationalId: string;
  baseSalary: number;
  telegramChatId?: string;
  assignedCourseIds: string[];
  username: string;
  password?: string;
  monthlySalaries?: Record<string, { status: 'Paid' | 'Unpaid', method?: 'Cash' | 'Bank Transfer', receiptUrl?: string }>;
}

export interface FinancialTransaction {
  id: string;
  type: 'Income' | 'Outcome';
  category: string;
  date: string;
  amount: number;
  description: string;
}

export interface Course {
  id: string;
  name: string;
  schedule: string;
  teacherId?: string;
  classroom: string;
  term: string; // e.g. 'Summer 2026', 'Winter 2026'
  description?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank';
  receiptNumber: string;
}

export interface Salary {
  id: string;
  teacherId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Unpaid';
  receiptNumber: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Permission';
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  scores: {
    quiz1: number; // 15%
    quiz2: number; // 15%
    midExam: number; // 30%
    finalExam: number; // 40%
  };
  totalScore: number;
  comments: string;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Permission';
}

export interface SystemAdmin {
  id: string;
  nationalId: string;
  fullName: string;
  fathersName: string;
  mothersName?: string;
  phone: string;
  address: string;
  email: string;
  username: string;
  password?: string;
  role: 'Admin';
}

// Generate realistic mock data
const generateStudents = (count: number): Student[] => {
  return Array.from({ length: count }).map((_, i) => {
    const fName = `Student ${i + 1}`;
    const father = `Father ${i + 1}`;
    const idCode = `S${fName.charAt(0)}${father.charAt(0)}${(i + 1).toString().padStart(4, '0')}`;
    
    return {
      id: `stu_${i + 1}`,
      fullName: fName,
      fathersName: father,
      mothersName: `Mother ${i + 1}`,
      phone: `+251 911 ${i.toString().padStart(6, '0')}`,
      address: `Addis Ababa, Subcity ${i % 10}`,
      registrationNumber: idCode,
      enrolledCourseIds: [`crs_${(i % 20) + 1}`, `crs_${((i + 5) % 20) + 1}`],
      academicHistory: [
        { term: 'Summer 2025', enrolledCourseIds: [`crs_${(i % 5) + 1}`], status: 'Completed' },
        { term: 'Winter 2025', enrolledCourseIds: [`crs_${(i % 10) + 1}`], status: 'Completed' },
        { term: 'Summer 2026', enrolledCourseIds: [`crs_${(i % 20) + 1}`, `crs_${((i + 5) % 20) + 1}`], status: 'Active' }
      ],
      totalFee: 1500,
      amountPaid: i % 3 === 0 ? 1500 : (i % 2 === 0 ? 500 : 0),
    };
  });
};

// const generateTeachers = (count: number): Teacher[] => {
//   return Array.from({ length: count }).map((_, i) => {
//     const fName = `Ustaz ${i + 1}`;
//     const father = `Ali ${i + 1}`;
//     const idCode = `${fName.charAt(0)}${father.charAt(0)}${(i + 1).toString().padStart(3, '0')}`;
    
//     return {
//       id: `tch_${i + 1}`,
//       fullName: fName,
//       fathersName: father,
//       mothersName: `Fatima ${i + 1}`,
//       contact: `+251 922 ${i.toString().padStart(6, '0')}`,
//       nationalId: idCode,
//       baseSalary: 4000 + (i % 3) * 1000,
//       assignedCourseIds: i % 3 === 0 ? [] : [`crs_${(i % 20) + 1}`],
//       username: `teacher${i + 1}`,
//     };
//   });
// };

// const courseNames = [
//   'Mathematics', 'English Language', 'General Science', 'Social Studies', 
//   'Aqeedah Core', 'Aqeedah Advanced', 'Fiqh Al-Ibadat', 'Fiqh Al-Muamalat', 
//   'Arabic Language Level 1', 'Arabic Language Level 2', 'Seerah', 'Tafseer Basic',
//   'Hadith Nawawi', 'Qawaid', 'Nahwu', 'Sarf', 'Islamic History', 'Adab', 'Computer Science', 'Physical Education'
// ];

// const generateCourses = (): Course[] => {
//   return courseNames.map((name, i) => ({
//     id: `crs_${i + 1}`,
//     name,
//     schedule: ['Mon/Wed 4:00 PM', 'Tue/Thu 5:00 PM', 'Sat/Sun 8:00 AM', 'Fri/Sun 10:00 AM'][i % 4],
//     classroom: `Room ${101 + (i % 5)}`,
//     teacherId: `tch_${(i % 15) + 1}`,
//     term: i % 2 === 0 ? 'Summer 2026' : 'Winter 2026'
//   }));
// };

export const initialCourses: Course[] = [];
export const initialTeachers: Teacher[] = [];

export const initialAdmins: SystemAdmin[] = [
  { 
    id: 'admin_1', 
    nationalId: 'MA001',
    fullName: 'Master', 
    fathersName: 'Admin',
    phone: '+251 900 000 000', 
    address: 'System Headquarters',
    email: 'admin@madrasah.edu.et',
    username: 'admin', 
    password: 'admin123',
    role: 'Admin' 
  }
];

export const initialStudents = generateStudents(40);
