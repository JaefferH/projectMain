# 📚 Al-Imam Hassen Meddressa - Complete System Flow & Frontend Integration Guide

## 1. System Overview & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React + Tailwind)              │
│   • Admin Portal (Students, Teachers, Finance, Attendance, Telegram)   │
│   • Teacher Portal (Roster, Attendance, Gradebook, Schedule, Salary)   │
│   • Multi-Language & RTL (English, Arabic, Amharic)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API Calls
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER (Express + Node + TS)            │
│   • Port: 5000                                                         │
│   • Auth: JWT Token & Refresh Token Flow                               │
│   • Controllers & Services: Modular RBAC & Zod Schema Validation       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐   ┌────────────────────────────────┐
│      Prisma ORM & PostgreSQL      │   │  JSON File Store Fallback      │
│  (Neon DB / Local PostgreSQL)     │   │  (server/data/*.json)          │
└───────────────────────────────────┘   └────────────────────────────────┘
```

---

## 2. Comprehensive Endpoint Matrix

### 🔒 Authentication & Users
- `POST /api/auth/login` - User login & JWT issue
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Password recovery
- `GET /api/users` - Fetch user list (Admin, Teacher, Parent)
- `GET /api/roles` & `GET /api/permissions` - RBAC Management

### 🏫 Academic & Classroom
- `GET / POST / PUT / DELETE /api/academic-years` - Academic years
- `GET / POST / PUT / DELETE /api/academic-terms` - Academic terms/semesters
- `GET / POST / PUT / DELETE /api/classrooms` - Classrooms (Levels & Sections)
- `GET / POST / PUT / DELETE /api/subjects` - Subject curriculum
- `GET / POST / PUT / DELETE /api/teacher-assignments` - Assign teachers to classes

### 👨‍🎓 Students & Guardians
- `GET / POST / PUT / DELETE /api/students` - Student records & profiles
- `GET / POST / PUT / DELETE /api/enrollments` - Student class enrollment
- `GET / POST / PUT / DELETE /api/guardians` - Guardian contact info

### 📊 Attendance & Assessment
- `GET / PUT /api/student-attendance` - Student attendance records
- `GET / PUT /api/staff-attendance` - Teacher/Staff attendance records
- `GET / POST / PUT / DELETE /api/assessments` - Exam & Quiz records
- `GET / POST /api/report-cards` - Student report cards & grade sheets

### 💰 Finance & Payroll
- `GET / POST / PUT / DELETE /api/fee-structures` - Student fee config
- `GET / POST / PUT / DELETE /api/invoices` - Fee invoices
- `GET / POST / PUT / DELETE /api/payments` - Student fee payment entries
- `GET / POST / PUT / DELETE /api/salary-structures` - Staff base salaries
- `GET / POST / PUT / DELETE /api/salary-payments` - Monthly payroll execution
- `GET / POST / PUT / DELETE /api/revenues` & `/api/expenses` - Cashflow tracking

### 📢 Notifications & Telegram
- `POST /api/telegram/send` - Send Telegram notifications
- `GET / POST /api/announcements` - Mass school announcements

---

## 3. How Frontend Integrates with Backend

1. **State Management**:
   - `src/store/useAppStore.ts`: Controls user authentication state, active role (`admin` | `teacher`), screen navigation (`currentScreen`), and language / RTL settings.
   - `src/store/useDataStore.ts`: Fetches and caches students, teachers, courses, attendance, finance, and grade data from `/api/*` endpoints.

2. **Running the App Locally**:
   ```bash
   # Option A: Run both Frontend & Backend concurrently
   npm run dev

   # Option B: Run separately
   # Terminal 1: Backend Server (Port 5000)
   cd server && npm run dev

   # Terminal 2: Frontend App (Vite)
   npm run dev
   ```

---
