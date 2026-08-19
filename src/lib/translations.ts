type TranslationDictionary = {
  [key: string]: {
    en: string;
    am: string;
    ar: string;
  };
};

export const translations: TranslationDictionary = {
  title: {
    en: "Al Imam Hassen Masjid and Meddressa",
    am: "አል ኢማም ሀሰን መስጂድ እና መድረሳ",
    ar: "مَسْجِد وَمَدْرَسَة الإِمَام حَسَن"
  },
  enterPortal: {
    en: "Enter Portal",
    am: "ግቡ",
    ar: "ادخل"
  },
  login: {
    en: "Login",
    am: "ግባ",
    ar: "تسجيل الدخول"
  },
  username: {
    en: "Username",
    am: "የመጠቀሚያ ስም",
    ar: "اسم المستخدم"
  },
  password: {
    en: "Password",
    am: "የይለፍ ቃል",
    ar: "كلمة المرور"
  },
  adminPortal: {
    en: "Administration Portal",
    am: "የአስተዳደር ፖርታል",
    ar: "بوابة الإدارة"
  },
  facultyPortal: {
    en: "Faculty & Ustaz Portal",
    am: "የመምህራን ፖርታል",
    ar: "بوابة المعلمين"
  },
  totalStudents: {
    en: "Total Students",
    am: "አጠቃላይ ተማሪዎች",
    ar: "إجمالي الطلاب"
  },
  totalTeachers: {
    en: "Total Teachers",
    am: "አጠቃላይ መምህራን",
    ar: "إجمالي المعلمين"
  },
  attendancePercentage: {
    en: "Attendance",
    am: "የመገኘት መቶኛ",
    ar: "نسبة الحضور"
  },
  revenueBalance: {
    en: "Revenue Balance",
    am: "የገቢ መጠን",
    ar: "رصيد الإيرادات"
  },
  activeCourses: {
    en: "Active Courses",
    am: "ገቢር ኮርሶች",
    ar: "الدورات النشطة"
  },
  logout: {
    en: "Logout",
    am: "ውጣ",
    ar: "تسجيل خروج"
  },
  dashboard: {
    en: "Dashboard",
    am: "ዳሽቦርድ",
    ar: "لوحة القيادة"
  },
  students: {
    en: "Students",
    am: "ተማሪዎች",
    ar: "الطلاب"
  },
  teachers: {
    en: "Teachers",
    am: "መምህራን",
    ar: "المعلمون"
  },
  tuition: {
    en: "Tuition & Payments",
    am: "ትምህርት ክፍያ",
    ar: "الرسوم الدراسية"
  },
  courses: {
    en: "Courses",
    am: "ኮርሶች",
    ar: "الدورات"
  },
  mySchedule: {
    en: "My Schedule",
    am: "የእኔ መርሃ ግብር",
    ar: "جدولي"
  },
  attendance: {
    en: "Attendance",
    am: "መገኘት",
    ar: "الحضور"
  },
  gradebook: {
    en: "Gradebook",
    am: "የውጤት መዝገብ",
    ar: "سجل الدرجات"
  },
  salaryLedger: {
    en: "Salary Ledger",
    am: "የደመወዝ መዝገብ",
    ar: "سجل الراتب"
  },
};

export const quotes = [
  {
    ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    en: "And say: My Lord, increase me in knowledge. (Quran 20:114)",
    am: "«ጌታዬ ሆይ! እውቀትን ጨምርልኝ» በል። (ቁርአን 20:114)"
  },
  {
    ar: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    en: "Allah will raise those who have believed among you and those who were given knowledge, by degrees. (Quran 58:11)",
    am: "አላህ ከእናንተ ያመኑትንና እውቀትን የተሰጡትን በደረጃዎች ከፍ ያደርጋል። (ቁርአን 58:11)"
  },
  {
    ar: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    en: "Whoever travels a path in search of knowledge, Allah will make easy for him a path to Paradise. (Sahih Muslim)",
    am: "ዕውቀትን ፈልጎ መንገድን የጀመረ ሰው አላህ ወደ ገነት መንገዱን ያገራለታል። (ሶሂህ ሙስሊም)"
  },
  {
    ar: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
    en: "Seeking knowledge is an obligation upon every Muslim. (Sunan Ibn Majah)",
    am: "ዕውቀትን መፈለግ በሙስሊም ሁሉ ላይ ግዴታ ነው። (ሱነን ኢብን ማጃህ)"
  }
];

export function t(key: string, lang: 'en' | 'am' | 'ar'): string {
  return translations[key]?.[lang] || key;
}
