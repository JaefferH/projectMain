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
  username?: string;
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

export const initialCourses: Course[] = [
  {
    id: 'crs_1',
    name: 'Aqeedah Core (العقيدة)',
    schedule: 'Mon/Wed 4:00 PM',
    classroom: 'Room 101',
    teacherId: 'tch_1',
    term: 'Summer 2026',
    description: 'Foundations of Islamic Faith and Tawheed'
  },
  {
    id: 'crs_2',
    name: 'Quran & Tajweed (القرآن والتجويد)',
    schedule: 'Tue/Thu 5:00 PM',
    classroom: 'Room 102',
    teacherId: 'tch_1',
    term: 'Summer 2026',
    description: 'Recitation rules, Makharij, and Memorization'
  },
  {
    id: 'crs_3',
    name: 'Arabic Language Level 1 (اللغة العربية)',
    schedule: 'Sat/Sun 8:00 AM',
    classroom: 'Room 103',
    teacherId: 'tch_2',
    term: 'Summer 2026',
    description: 'Grammar (Nahw) and Morphology (Sarf) fundamentals'
  },
  {
    id: 'crs_4',
    name: 'Fiqh Al-Ibadat (فقه العبادات)',
    schedule: 'Fri/Sun 10:00 AM',
    classroom: 'Room 104',
    teacherId: 'tch_2',
    term: 'Summer 2026',
    description: 'Jurisprudence of purification, prayer, and fasting'
  }
];

export const initialTeachers: Teacher[] = [
  {
    id: 'tch_1',
    fullName: 'Ustaz Ali',
    fathersName: 'Hassan',
    contact: '+251 922 111 222',
    nationalId: 'T001',
    baseSalary: 5000,
    assignedCourseIds: ['crs_1', 'crs_2'],
    username: 'teacher1',
    password: 'password123',
    monthlySalaries: {
      'September': { status: 'Paid', method: 'Bank Transfer' }
    }
  },
  {
    id: 'tch_2',
    fullName: 'Ustadh Jaffer',
    fathersName: 'Hussein',
    contact: '+251 922 333 444',
    nationalId: 'T002',
    baseSalary: 6000,
    assignedCourseIds: ['crs_3', 'crs_4'],
    username: 'teacher2',
    password: 'password123',
    monthlySalaries: {}
  },
  {
    id: 'tch_3',
    fullName: 'Test Teacher',
    fathersName: 'Admin',
    contact: '+251 911 111 222',
    nationalId: 'TCH-99',
    baseSalary: 4500,
    assignedCourseIds: ['crs_1'],
    username: 'testteacher',
    password: 'password123',
    monthlySalaries: {
      'September': { status: 'Paid', method: 'Cash' }
    }
  }
];

export const initialAdmins: SystemAdmin[] = [
  { 
    id: 'admin_1', 
    nationalId: 'MA001',
    fullName: 'Master Admin', 
    fathersName: 'Admin',
    phone: '+251 900 000 000', 
    address: 'System Headquarters',
    email: 'admin@madrasah.edu.et',
    username: 'admin', 
    password: 'newAdmin@123',
    role: 'Admin' 
  },
  { 
    id: 'admin_2', 
    nationalId: 'MA002',
    fullName: 'Mudir / Principal', 
    fathersName: 'Admin',
    phone: '+251 900 000 001', 
    address: 'Main Campus',
    email: 'mudir@madrasah.edu.et',
    username: 'mudir', 
    password: 'admin123',
    role: 'Admin' 
  }
];

export const initialStudents: Student[] = [
  {
    id: 'stu_1',
    fullName: 'Bilal Ibrahim',
    fathersName: 'Ibrahim',
    phone: '+251 911 000 111',
    address: 'Addis Ababa, Kolfe',
    registrationNumber: 'SBI0001',
    enrolledCourseIds: ['crs_1', 'crs_2'],
    academicHistory: [
      { term: 'Summer 2025', enrolledCourseIds: ['crs_1'], status: 'Completed' },
      { term: 'Winter 2025', enrolledCourseIds: ['crs_1', 'crs_2'], status: 'Completed' },
      { term: 'Summer 2026', enrolledCourseIds: ['crs_1', 'crs_2'], status: 'Active' }
    ],
    totalFee: 1500,
    amountPaid: 1500,
    password: 'password123',
    monthlyFees: {
      'September': { status: 'Paid', method: 'Cash' }
    }
  },
  {
    id: 'stu_2',
    fullName: 'Fatima Zohra',
    fathersName: 'Omar',
    phone: '+251 911 333 444',
    address: 'Addis Ababa, Atena Tera',
    registrationNumber: 'SBI0002',
    enrolledCourseIds: ['crs_3', 'crs_4'],
    academicHistory: [
      { term: 'Summer 2026', enrolledCourseIds: ['crs_3', 'crs_4'], status: 'Active' }
    ],
    totalFee: 1500,
    amountPaid: 1500,
    password: 'password123',
    monthlyFees: {
      'September': { status: 'Paid', method: 'Bank Transfer' }
    }
  },
  ...generateStudents(20).slice(2)
];
