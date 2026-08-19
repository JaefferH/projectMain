# Dashboard Module - API Reference

Base URL: `/api/dashboard`

## Overview
Role-based dashboard providing analytics, summaries, and quick access to key information for Admin, Teacher, and Student users.

---

## Main Dashboard

### Get Dashboard
```
GET /api/dashboard
Authorization: Bearer {accessToken}
```

Returns role-specific dashboard data. The response structure varies based on the user's role.

---

## Admin Dashboard

**Response:**
```json
{
  "success": true,
  "message": "Dashboard retrieved successfully.",
  "data": {
    "type": "admin",
    "isSuperAdmin": true,
    "branchId": "branch_id",
    "academicYear": {
      "id": "year_id",
      "name": "2024/2025"
    },
    "currentTerm": {
      "id": "term_id",
      "name": "First Semester",
      "type": "SEMESTER_1"
    },
    "stats": {
      "totalStudents": 450,
      "totalTeachers": 25,
      "totalStaff": 30,
      "totalClassrooms": 18
    },
    "finance": {
      "monthlyFeesCollected": 850000,
      "pendingFees": 150000,
      "pendingInvoicesCount": 45,
      "monthlyRevenue": 50000,
      "monthlyExpenses": 35000,
      "monthlySalaries": 250000,
      "netIncome": 615000
    },
    "attendance": {
      "total": 13500,
      "present": 12420,
      "absent": 540,
      "late": 540,
      "rate": 92
    },
    "recentActivity": {
      "newStudents": [
        {
          "id": "user_id",
          "name": "Ahmed Mohammed",
          "registrationNumber": "STU-2024-050",
          "joinedAt": "2024-09-01T00:00:00.000Z"
        }
      ],
      "recentPayments": [
        {
          "id": "payment_id",
          "student": "Mohammed Ahmed",
          "amount": 5000,
          "receiptNumber": "RCP-MAIN-2024-0050",
          "date": "2024-09-15T10:00:00.000Z"
        }
      ],
      "announcements": [
        {
          "id": "announcement_id",
          "title": "Staff Meeting Tomorrow",
          "type": "MEETING",
          "priority": "HIGH",
          "createdAt": "2024-09-14T08:00:00.000Z"
        }
      ]
    }
  }
}
```

### Admin Dashboard Sections:

| Section | Description |
|---------|-------------|
| **stats** | Total counts for students, teachers, staff, classrooms |
| **finance** | Monthly financial summary (fees, revenue, expenses, salaries) |
| **attendance** | 30-day attendance overview with rate |
| **recentActivity** | Latest 5 new students, payments, announcements |

**Note:** SUPER_ADMIN sees data across all branches. ADMIN sees only their branch.

---

## Teacher Dashboard

**Response:**
```json
{
  "success": true,
  "message": "Dashboard retrieved successfully.",
  "data": {
    "type": "teacher",
    "teacher": {
      "id": "teacher_profile_id",
      "fullName": "Sumeya Besha",
      "employeeNumber": "TCH-001"
    },
    "homeroomClass": {
      "classroom": {
        "id": "classroom_id",
        "name": "Grade 10-A"
      },
      "academicTerm": {
        "id": "term_id",
        "name": "First Semester",
        "academicYear": { "id": "year_id", "name": "2024/2025" }
      },
      "totalStudents": 35,
      "todayAttendance": {
        "taken": true,
        "present": 33,
        "absent": 1,
        "late": 1,
        "isLocked": false
      }
    },
    "todaySchedule": [
      {
        "period": {
          "id": "period_id",
          "name": "Period 1",
          "shortName": "P1",
          "order": 2,
          "startTime": "08:20",
          "endTime": "09:05"
        },
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH-101"
        },
        "classroom": {
          "id": "classroom_id",
          "name": "Grade 10-A"
        },
        "room": "Room 101"
      }
    ],
    "pendingAssessments": [
      {
        "id": "assessment_id",
        "title": "Mathematics Quiz 3",
        "type": "QUIZ",
        "classroom": "Grade 10-A",
        "resultsCount": 0,
        "assessmentDate": "2024-09-20T09:00:00.000Z"
      }
    ],
    "announcements": [
      {
        "id": "announcement_id",
        "title": "Staff Meeting Tomorrow",
        "type": "MEETING",
        "createdAt": "2024-09-14T08:00:00.000Z"
      }
    ]
  }
}
```

### Teacher Dashboard Sections:

| Section | Description |
|---------|-------------|
| **homeroomClass** | Homeroom class info with today's attendance status |
| **todaySchedule** | Today's teaching periods with subjects and classrooms |
| **pendingAssessments** | Assessments that need grading (no results yet) |
| **announcements** | Latest 3 announcements |

**Note:** If teacher has no homeroom assignment, `homeroomClass` is null.

---

## Student Dashboard

**Response:**
```json
{
  "success": true,
  "message": "Dashboard retrieved successfully.",
  "data": {
    "type": "student",
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "hasEnrollment": true,
    "classroom": {
      "id": "classroom_id",
      "name": "Grade 10-A"
    },
    "academicTerm": {
      "id": "term_id",
      "name": "First Semester",
      "type": "SEMESTER_1",
      "academicYear": { "id": "year_id", "name": "2024/2025" }
    },
    "todaySchedule": [
      {
        "period": {
          "id": "period_id",
          "name": "Period 1",
          "shortName": "P1",
          "order": 2,
          "startTime": "08:20",
          "endTime": "09:05"
        },
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH-101"
        },
        "teacher": "Sumeya Besha",
        "room": "Room 101"
      }
    ],
    "recentGrades": [
      {
        "id": "result_id",
        "assessment": "Mathematics Quiz 2",
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH-101"
        },
        "marks": 45,
        "percentage": 90
      }
    ],
    "fees": {
      "totalInvoices": 5,
      "pendingInvoices": 2,
      "totalOwed": 10000,
      "status": "PENDING"
    },
    "attendance": {
      "total": 45,
      "present": 42,
      "absent": 1,
      "late": 2,
      "rate": 93
    },
    "upcomingAssessments": [
      {
        "id": "assessment_id",
        "title": "Mathematics Quiz 3",
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH-101"
        },
        "type": "QUIZ",
        "assessmentDate": "2024-09-20T09:00:00.000Z"
      }
    ]
  }
}
```

### Student Dashboard Sections:

| Section | Description |
|---------|-------------|
| **todaySchedule** | Today's class schedule with subjects and teachers |
| **recentGrades** | Latest 5 published assessment results |
| **fees** | Invoice summary with total owed |
| **attendance** | Attendance statistics |
| **upcomingAssessments** | Scheduled assessments (not yet published) |

**Note:** If student has no active enrollment, `hasEnrollment` is false.

---

## Calendar

### Get Calendar Events
```
GET /api/dashboard/calendar?month=9&year=2024
Authorization: Bearer {accessToken}
```

Returns events and announcements for the specified month.

**Response:**
```json
{
  "success": true,
  "message": "Calendar events retrieved successfully.",
  "data": {
    "month": 9,
    "year": 2024,
    "events": [
      {
        "id": "announcement_id",
        "title": "Annual Sports Day",
        "description": "Events include football, basketball...",
        "type": "EVENT",
        "priority": "HIGH",
        "date": "2024-09-20T00:00:00.000Z",
        "startTime": "08:00",
        "endTime": "16:00",
        "location": "School Sports Field",
        "isAllDay": true,
        "color": "#007BFF",
        "startDate": "2024-09-20T00:00:00.000Z",
        "endDate": "2024-09-20T00:00:00.000Z"
      },
      {
        "id": "announcement_id",
        "title": "Parent-Teacher Meeting",
        "description": "All parents requested to attend",
        "type": "MEETING",
        "priority": "HIGH",
        "date": "2024-09-15T00:00:00.000Z",
        "startTime": "15:00",
        "endTime": "17:00",
        "location": "School Hall",
        "isAllDay": false,
        "color": "#FFC107"
      }
    ]
  }
}
```

### Event Color Coding:
| Type | Color |
|------|-------|
| EXAM | 🔴 Red (#DC3545) |
| HOLIDAY | 🟢 Green (#28A745) |
| EVENT | 🔵 Blue (#007BFF) |
| MEETING | 🟡 Yellow (#FFC107) |
| EMERGENCY | 🔴 Red (#DC3545) |
| FEE_DUE | 🟠 Orange (#FD7E14) |
| GENERAL | ⚫ Gray (#6C757D) |
| URGENT priority | 🔴 Red |

---

## Dashboard Data Refresh

| Data | Cache TTL | Refresh Trigger |
|------|-----------|-----------------|
| Admin Dashboard | 2 minutes | Any mutation |
| Teacher Dashboard | 2 minutes | Attendance, assessment changes |
| Student Dashboard | 2 minutes | Grades, fees, attendance changes |
| Calendar | 5 minutes | New announcements/events |

---

## Dashboard Access Summary

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| Total counts | ✅ | ❌ | ❌ |
| Financial overview | ✅ | ❌ | ❌ |
| Attendance stats | ✅ | ✅ (class) | ✅ (own) |
| Today's schedule | ❌ | ✅ | ✅ |
| Pending assessments | ❌ | ✅ | ❌ |
| Recent grades | ❌ | ❌ | ✅ |
| Fee status | ❌ | ❌ | ✅ |
| Upcoming assessments | ❌ | ❌ | ✅ |
| Recent activity | ✅ | ❌ | ❌ |
| Calendar events | ✅ | ✅ | ✅ |
| Announcements | ✅ | ✅ | ✅ |
```