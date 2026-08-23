# Al Imam Hassan Mosque & Madrasah — Management System
> **مَسْجِدُ وَمَدْرَسَةُ الإِمَامِ حَسَنٍ** • **አል ኢማም ሀሰን መስጂድ እና መድረሳ**

A comprehensive, multi-lingual Academic & Administrative Management Portal built for **Al Imam Hassan Mosque & Madrasah**, supporting student enrollments, faculty profiles, attendance registers, gradebooks, finance ledgers, and automated semester closure workflows.

---

## Key Features

### 1. Multi-Lingual & RTL Support
* **Languages Supported**: English, አማርኛ (Amharic), and العربية (Arabic).
* Dynamic RTL direction switching for Arabic typography and right-to-left layout alignment.
* Interactive Flag Dropdown selector available on public pages and portal dashboards.

### 2. Day & Night Mode System
* Global light and dark mode styling with high-contrast emerald (`#047857` / `#042c22`) and glowing mint (`#34d399` / `#6ee7b7`) palettes.
* **In-Portal Theme Toggle Switch**: Quick access toggle (`Light` / `Dark`) inside `MainLayout.tsx` for logged-in staff and students.

### 3. Administrator Portal (`/portal` -> Admin)
* **Student Enrollments & Guardians**: Manage student records, tuition fee status, and parent contact information.
* **Faculty & Employee Profiles**: Manage teacher details, base salary, national IDs, and assigned classes.
* **Teacher Attendance Audit**: Log and track daily teacher attendance with database persistence.
* **Institute Finance & Ledger**: Audit income/expenses, generate financial statements, and track tuition payments.
* **Academic Courses & Classes**: Create, edit, and assign classrooms, schedules, and faculty.
* **Telegram Communication Gateway**: Broadcast announcements and updates via Telegram integration.
* **Academic Term Closure Wizard**: Freeze term marks, attendance, and fee logs into permanent timelines before resetting active workspaces.

### 4. Teacher Portal (`/portal` -> Teacher)
* **Class Roster & Student Details**: Access assigned student lists and guardian contacts.
* **Student Attendance Register**: Mark daily student attendance (`Present`, `Absent`, `Permission`).
* **Assessments & Gradebook**: Record test scores, midterm marks, and final exam grades.
* **Teaching Schedule & Timetable**: View weekly class schedules and classroom locations.
* **Personal Salary Ledger**: Inspect monthly salary statements, payment methods, and payslips.

### 5. Student Portal (`/portal` -> Student)
* **Academic Assessment Report**: View subject grades, GPA metrics, and term performance.
* **Attendance Audit**: Track personal attendance percentage and monthly breakdown.
* **Class Timetable**: View daily class schedules and assigned teachers.
* **Tuition Fee Ledger**: Check fee status, payments made, and outstanding balances.

---

## Tech Stack

* **Frontend**: React 18, Vite 8, TypeScript, Tailwind CSS, Framer Motion, Lucide React Icons.
* **Backend**: Node.js, Express.js, TypeScript, Prisma ORM.
* **Database & Caching**: PostgreSQL (Prisma Client) with Redis cache fallback logic.
* **Exporting**: SheetJS (`xlsx`) for dataset exports to Excel.
