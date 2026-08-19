# Database Schema

## Overview
The database uses PostgreSQL with Prisma ORM. The schema is designed for a multi-tenant school management system.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORE ENTITIES                                      │
│                                                                              │
│  Organization ──┬── Branch ──┬── AcademicYear ──┬── AcademicTerm            │
│                 │            │                   ├── Classroom               │
│                 │            │                   └── FeeStructure            │
│                 │            ├── User                                           │
│                 │            ├── Guardian                                      │
│                 │            ├── SchedulePeriod                                │
│                 │            ├── FeeCategory                                   │
│                 │            ├── RevenueCategory                               │
│                 │            ├── ExpenseCategory                               │
│                 │            └── Announcement                                  │
│                 │                                                              │
│  User ──┬── UserProfile ──┬── StudentEnrollment ── Classroom                 │
│         │                  ├── TeacherAssignment ── Subject, Classroom        │
│         │                  ├── HomeroomTeacher ── Classroom                   │
│         │                  ├── StaffAttendanceRecord                           │
│         │                  └── SalaryStructure ── SalaryPayment                │
│         │                                                                      │
│         ├── UserRoleAssignment ── Role ── RolePermission ── Permission         │
│         ├── UserSession                                                        │
│         └── PasswordResetToken                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Models

### Organization
```prisma
model Organization {
  id        String    @id @default(cuid())
  name      String
  code      String    @unique
  logoUrl   String?
  email     String?
  phone     String?
  website   String?
  address   String?
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  branches  Branch[]
  subjects  Subject[]
  users     User[]
}
```

### Branch
```prisma
model Branch {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  code           String
  phone          String?
  email          String?
  address        String?
  city           String?
  region         String?
  country        String?  @default("Ethiopia")
  isMainCampus   Boolean  @default(false)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  
  academicYears     AcademicYear[]
  users             User[]
  userProfiles      UserProfile[]
  classrooms        Classroom[]
  subjects          Subject[]
  guardians         Guardian[]
  schedulePeriods   SchedulePeriod[]
  feeCategories     FeeCategory[]
  revenueCategories RevenueCategory[]
  expenseCategories ExpenseCategory[]
  announcements     Announcement[]
  expenses          Expense[]
  revenues          Revenue[]
  salaryPayments    SalaryPayment[]
  salaryStructures  SalaryStructure[]
  staffAttendance   StaffAttendanceRecord[]

  @@unique([organizationId, code])
}
```

### User
```prisma
model User {
  id               String    @id @default(cuid())
  organizationId   String
  username         String    @unique
  email            String?   @unique
  passwordHash     String
  isActive         Boolean   @default(true)
  lastLoginAt      DateTime?
  passwordChangedAt DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  branchId         String?

  organization     Organization @relation(fields: [organizationId], references: [id])
  branch           Branch?      @relation(fields: [branchId], references: [id])
  profile          UserProfile?
  role             UserRoleAssignment[]
  sessions         UserSession[]
  passwordResetTokens PasswordResetToken[]
}
```

### UserProfile (Unified Profile)
```prisma
model UserProfile {
  id                 String   @id @default(cuid())
  userId             String   @unique
  branchId           String
  fullName           String
  fathersName        String
  mothersName        String?
  gender             Gender?
  nationalId         String?
  phone              String?
  email              String?
  address            String?
  photoUrl           String?
  notes              String?
  employeeNumber     String?
  registrationNumber String?
  baseSalary         Decimal?
  telegramChatId     String?
  hireDate           DateTime?
  admissionDate      DateTime?
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user               User     @relation(fields: [userId], references: [id])
  branch             Branch   @relation(fields: [branchId], references: [id])
}
```

### Role & Permission
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  permissions RolePermission[]
  users       UserRoleAssignment[]
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  roles       RolePermission[]
}

model UserRoleAssignment {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])
  role       Role     @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}

model RolePermission {
  roleId       String
  permissionId String

  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}
```

---

## Academic Models

```prisma
model AcademicYear {
  id         String   @id @default(cuid())
  branchId   String
  name       String
  startDate  DateTime
  endDate    DateTime
  isCurrent  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  branch     Branch   @relation(fields: [branchId], references: [id])
  terms      AcademicTerm[]
  classrooms Classroom[]
  feeStructures FeeStructure[]
}

model AcademicTerm {
  id             String           @id @default(cuid())
  academicYearId String
  name           String
  type           AcademicTermType
  startDate      DateTime
  endDate        DateTime
  isCurrent      Boolean          @default(false)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  academicYear   AcademicYear     @relation(fields: [academicYearId], references: [id])
  enrollments    StudentEnrollment[]
  assignments    TeacherAssignment[]
}

model Classroom {
  id             String   @id @default(cuid())
  branchId       String
  academicYearId String
  name           String
  capacity       Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  branch         Branch        @relation(fields: [branchId], references: [id])
  academicYear   AcademicYear  @relation(fields: [academicYearId], references: [id])
  enrollments    StudentEnrollment[]
  assignments    TeacherAssignment[]
}

model Subject {
  id             String   @id @default(cuid())
  organizationId String
  code           String
  name           String
  description    String?
  isActive       Boolean  @default(true)
  branchId       String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  branch         Branch?      @relation(fields: [branchId], references: [id])
  assignments    TeacherAssignment[]
}
```

---

## Student Models

```prisma
model StudentEnrollment {
  id             String   @id @default(cuid())
  studentId      String
  classroomId    String
  academicTermId String
  enrollmentDate DateTime @default(now())
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  student        UserProfile    @relation(fields: [studentId], references: [id])
  classroom      Classroom      @relation(fields: [classroomId], references: [id])
  academicTerm   AcademicTerm   @relation(fields: [academicTermId], references: [id])
  assessmentResults AssessmentResult[]
  attendanceRecords AttendanceRecord[]
  invoices        StudentInvoice[]
}

model Guardian {
  id               String   @id @default(cuid())
  branchId         String
  fullName         String
  relationship     String
  phone            String?
  alternativePhone String?
  email            String?
  occupation       String?
  address          String?
  nationalId       String?
  telegramChatId   String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  branch           Branch   @relation(fields: [branchId], references: [id])
  students         StudentGuardian[]
}

model StudentGuardian {
  studentId  String
  guardianId String
  isPrimary  Boolean  @default(false)

  student    UserProfile @relation(fields: [studentId], references: [id])
  guardian   Guardian    @relation(fields: [guardianId], references: [id])

  @@id([studentId, guardianId])
}
```

---

## Finance Models

```prisma
model FeeCategory {
  id          String   @id @default(cuid())
  branchId    String
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  branch      Branch   @relation(fields: [branchId], references: [id])
  structures  FeeStructure[]
}

model FeeStructure {
  id              String   @id @default(cuid())
  academicYearId  String
  feeCategoryId   String
  amount          Decimal  @db.Decimal(12, 2)
  dueDate         DateTime?
  isOptional      Boolean  @default(false)
  isRecurring     Boolean  @default(false)
  recurringInterval String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  academicYear    AcademicYear @relation(fields: [academicYearId], references: [id])
  feeCategory     FeeCategory  @relation(fields: [feeCategoryId], references: [id])
  invoices        StudentInvoice[]
}

model StudentInvoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique
  enrollmentId    String
  feeStructureId  String
  amount          Decimal  @db.Decimal(12, 2)
  discount        Decimal  @default(0)
  discountReason  String?
  taxAmount       Decimal  @default(0)
  totalAmount     Decimal  @db.Decimal(12, 2)
  status          InvoiceStatus @default(PENDING)
  issuedAt        DateTime @default(now())
  dueDate         DateTime?
  paidAt          DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  enrollment      StudentEnrollment @relation(fields: [enrollmentId], references: [id])
  feeStructure    FeeStructure      @relation(fields: [feeStructureId], references: [id])
  payments        Payment[]
}

model Payment {
  id              String   @id @default(cuid())
  receiptNumber   String   @unique
  invoiceId       String
  amount          Decimal  @db.Decimal(12, 2)
  paymentMethod   PaymentMethod
  referenceNumber String?
  paymentDate     DateTime @default(now())
  notes           String?
  receivedByUserId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  invoice         StudentInvoice @relation(fields: [invoiceId], references: [id])
  receivedBy      User?          @relation(fields: [receivedByUserId], references: [id])
}
```

---

## Attendance Models

```prisma
model StudentAttendanceSession {
  id                String   @id @default(cuid())
  homeroomTeacherId String
  classroomId       String
  academicTermId    String
  sessionDate       DateTime @db.Date
  topic             String?
  notes             String?
  isLocked          Boolean  @default(false)
  lockedAt          DateTime?
  lockedBy          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  homeroomTeacher   HomeroomTeacher @relation(fields: [homeroomTeacherId], references: [id])
  classroom         Classroom       @relation(fields: [classroomId], references: [id])
  academicTerm      AcademicTerm    @relation(fields: [academicTermId], references: [id])
  records           StudentAttendanceRecord[]
}

model StaffAttendanceRecord {
  id              String   @id @default(cuid())
  userId          String
  profileId       String
  branchId        String
  attendanceDate  DateTime @db.Date
  checkInTime     DateTime?
  checkOutTime    DateTime?
  status          StaffAttendanceStatus
  remarks         String?
  isLocked        Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User        @relation(fields: [userId], references: [id])
  profile         UserProfile @relation(fields: [profileId], references: [id])
  branch          Branch      @relation(fields: [branchId], references: [id])
}
```

---

## Complete Model List

| Category | Models |
|----------|--------|
| **Core** | Organization, Branch, User, UserProfile, UserSession, PasswordResetToken |
| **RBAC** | Role, Permission, UserRoleAssignment, RolePermission |
| **Academic** | AcademicYear, AcademicTerm, Classroom, Subject |
| **Teacher** | TeacherAssignment, HomeroomTeacher |
| **Student** | StudentEnrollment, Guardian, StudentGuardian |
| **Schedule** | SchedulePeriod, TimetableEntry |
| **Attendance** | StudentAttendanceSession, StudentAttendanceRecord, StaffAttendanceRecord |
| **Assessment** | Assessment, AssessmentResult |
| **Report Card** | ReportCard, ReportCardSubjectGrade |
| **Finance** | FeeCategory, FeeStructure, StudentInvoice, Payment, SalaryStructure, SalaryComponent, SalaryPayment, SalaryPaymentDetail, RevenueCategory, Revenue, ExpenseCategory, Expense, FinancialReport |
| **Announcement** | Announcement, AnnouncementDelivery, AnnouncementView, AnnouncementLog |
| **Telegram** | TelegramLink |
| **Communication** | TeacherGuardianMessage |
| **Total** | **40+ Models** |