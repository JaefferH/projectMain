# Attendance Module - API Reference

Base URLs: `/api/student-attendance`, `/api/staff-attendance`

## Overview
Manages student daily attendance (taken by homeroom teachers) and staff attendance (self check-in/out).

---

## Student Attendance

### List Attendance Sessions
```
GET /api/student-attendance?classroomId=id&academicTermId=id&startDate=2024-09-01&endDate=2024-09-30&isLocked=false&page=1&limit=10
Authorization: Bearer {accessToken}
Permission: academic:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance sessions retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "session_id",
        "classroomId": "classroom_id",
        "academicTermId": "term_id",
        "sessionDate": "2024-09-15T00:00:00.000Z",
        "topic": "Regular Classes",
        "notes": "Rainy day, some students arrived late",
        "isLocked": false,
        "lockedAt": null,
        "createdAt": "2024-09-15T08:00:00.000Z",
        "homeroomTeacher": {
          "id": "teacher_profile_id",
          "fullName": "Sumeya Besha",
          "employeeNumber": "TCH-001"
        },
        "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
        "academicTerm": {
          "id": "term_id",
          "name": "First Semester",
          "academicYear": "2024/2025"
        },
        "stats": {
          "totalRecords": 35,
          "present": 30,
          "absent": 2,
          "late": 2,
          "excused": 1
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
  }
}
```

### Get Attendance Session By ID
```
GET /api/student-attendance/:id
Permission: academic:read
```

**Response includes:**
- Session details with teacher info
- All student records with status
- Statistics summary

### Get My Attendance Sessions (Homeroom Teacher)
```
GET /api/student-attendance/my-sessions?academicTermId=term_id&startDate=2024-09-01&endDate=2024-09-30&includeRecords=true
Authorization: Bearer {teacherToken}
```

**Response includes student records in each session:**
```json
{
  "teacher": { "id": "profile_id", "fullName": "Sumeya Besha" },
  "hasHomeroomAssignment": true,
  "homeroomAssignment": {
    "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
    "academicTerm": { "id": "term_id", "name": "First Semester" }
  },
  "sessions": [
    {
      "id": "session_id",
      "sessionDate": "2024-09-15T00:00:00.000Z",
      "topic": "Regular Classes",
      "isLocked": false,
      "stats": { "present": 30, "absent": 2, "late": 2, "excused": 1 },
      "records": [
        {
          "id": "record_id",
          "enrollmentId": "enrollment_id",
          "status": "PRESENT",
          "remarks": null,
          "student": {
            "id": "student_profile_id",
            "fullName": "Mohammed Ahmed",
            "registrationNumber": "STU-2024-001",
            "photoUrl": "https://..."
          }
        }
      ]
    }
  ]
}
```

### Get My Attendance Session By ID (Teacher)
```
GET /api/student-attendance/my-sessions/:id
Authorization: Bearer {teacherToken}
```
Returns session details only if the teacher created it.

### Get Students for Today's Attendance (Homeroom Teacher)
```
GET /api/student-attendance/my-students?academicTermId=term_id
Authorization: Bearer {teacherToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Students list retrieved successfully.",
  "data": {
    "teacher": { "id": "profile_id", "fullName": "Sumeya Besha" },
    "hasHomeroomAssignment": true,
    "homeroomAssignment": {
      "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
      "academicTerm": { "id": "term_id", "name": "First Semester" }
    },
    "todayAttendance": {
      "alreadyTaken": false
    },
    "students": [
      {
        "enrollmentId": "enrollment_id",
        "student": {
          "id": "student_profile_id",
          "fullName": "Mohammed Ahmed",
          "registrationNumber": "STU-2024-001",
          "phone": "+251911223344",
          "photoUrl": "https://..."
        }
      }
    ],
    "summary": { "totalStudents": 35 }
  }
}
```

### Create Attendance Session (Homeroom Teacher)
```
POST /api/student-attendance
Authorization: Bearer {teacherToken}

{
  "classroomId": "classroom_id",
  "academicTermId": "term_id",
  "sessionDate": "2024-09-15",
  "topic": "Regular Classes",
  "notes": "Rainy day, some students arrived late",
  "records": [
    { "enrollmentId": "enrollment_1_id", "status": "PRESENT", "remarks": null },
    { "enrollmentId": "enrollment_2_id", "status": "LATE", "remarks": "Arrived 15 min late", "checkInTime": "2024-09-15T08:35:00.000Z" },
    { "enrollmentId": "enrollment_3_id", "status": "ABSENT", "remarks": "No notification" },
    { "enrollmentId": "enrollment_4_id", "status": "EXCUSED", "remarks": "Medical appointment" },
    { "enrollmentId": "enrollment_5_id", "status": "HALF_DAY", "remarks": "Left at noon" }
  ]
}
```

**Attendance Statuses:** PRESENT, ABSENT, LATE, EXCUSED, HALF_DAY

**Rules:**
- Only homeroom teacher can create attendance for their class
- One attendance session per classroom per day
- All enrollment IDs must belong to the classroom

### Update Attendance Record (Homeroom Teacher)
```
PATCH /api/student-attendance/my-sessions/:sessionId/records/:recordId
Authorization: Bearer {teacherToken}

{
  "status": "PRESENT",
  "remarks": "Correction: student was present"
}
```
**Note:** Cannot update locked sessions.

### Update Attendance Record (Admin)
```
PATCH /api/student-attendance/:sessionId/records/:recordId
Authorization: Bearer {adminToken}
Permission: academic:manage
```

### Lock Attendance Session (Homeroom Teacher)
```
PATCH /api/student-attendance/my-sessions/:id/lock
Authorization: Bearer {teacherToken}
```
Locks the session, preventing further modifications.

### Lock Attendance Session (Admin)
```
PATCH /api/student-attendance/:id/lock
Authorization: Bearer {adminToken}
Permission: academic:manage
```

### Get My Attendance (Student)
```
GET /api/student-attendance/my-attendance?academicTermId=term_id&startDate=2024-09-01&endDate=2024-09-30
Authorization: Bearer {studentToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Your attendance retrieved successfully.",
  "data": {
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "hasEnrollment": true,
    "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
    "academicTerm": { "id": "term_id", "name": "First Semester" },
    "records": [
      { "id": "record_id", "date": "2024-09-15T00:00:00.000Z", "status": "PRESENT", "topic": "Regular Classes", "remarks": null },
      { "id": "record_id", "date": "2024-09-14T00:00:00.000Z", "status": "LATE", "topic": "Regular Classes", "remarks": "Arrived 15 min late" }
    ],
    "summary": { "present": 12, "absent": 1, "late": 2, "excused": 0, "total": 15 },
    "attendancePercentage": 93
  }
}
```

---

## Staff Attendance

### List Staff Attendance
```
GET /api/staff-attendance?branchId=id&startDate=2024-09-01&endDate=2024-09-30&status=PRESENT&page=1&limit=20
Authorization: Bearer {accessToken}
Permission: academic:read
```

**Statuses:** PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, EXCUSED

**Success Response (200):**
```json
{
  "success": true,
  "message": "Staff attendance retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "record_id",
        "userId": "user_id",
        "profileId": "profile_id",
        "branchId": "branch_id",
        "attendanceDate": "2024-09-15T00:00:00.000Z",
        "checkInTime": "2024-09-15T08:00:00.000Z",
        "checkOutTime": "2024-09-15T17:00:00.000Z",
        "status": "PRESENT",
        "remarks": null,
        "isLocked": true,
        "staff": {
          "id": "profile_id",
          "fullName": "Sumeya Besha",
          "employeeNumber": "TCH-001",
          "phone": "+251912345678"
        },
        "branch": { "id": "branch_id", "name": "Main Campus" }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 300, "totalPages": 15 }
  }
}
```

### Staff Check-In
```
POST /api/staff-attendance/check-in
Authorization: Bearer {staffToken}

// Present (on time):
{
  "branchId": "branch_id",
  "attendanceDate": "2024-09-15",
  "checkInTime": "2024-09-15T08:00:00.000Z",
  "status": "PRESENT",
  "remarks": null
}

// Late:
{
  "branchId": "branch_id",
  "attendanceDate": "2024-09-15",
  "checkInTime": "2024-09-15T09:30:00.000Z",
  "status": "LATE",
  "remarks": "Traffic delay"
}

// Half Day:
{
  "branchId": "branch_id",
  "attendanceDate": "2024-09-15",
  "checkInTime": "2024-09-15T08:00:00.000Z",
  "status": "HALF_DAY",
  "remarks": "Personal appointment in afternoon"
}

// On Leave:
{
  "branchId": "branch_id",
  "attendanceDate": "2024-09-15",
  "status": "ON_LEAVE",
  "remarks": "Annual leave - approved"
}
```

**Rules:**
- One attendance record per staff per day
- Cannot check in twice for the same date

### Staff Check-Out
```
POST /api/staff-attendance/check-out
Authorization: Bearer {staffToken}

{
  "attendanceDate": "2024-09-15"
}
```

**Effects:**
- Sets check-out time to current time
- Auto-locks the record (prevents further modification)

**Rules:**
- Must have checked in first
- Cannot check out twice
- Cannot modify locked records

### Get My Attendance (Staff)
```
GET /api/staff-attendance/my-attendance?startDate=2024-09-01&endDate=2024-09-30
Authorization: Bearer {staffToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Your attendance retrieved successfully.",
  "data": {
    "staff": {
      "id": "profile_id",
      "fullName": "Sumeya Besha",
      "employeeNumber": "TCH-001"
    },
    "records": [
      {
        "id": "record_id",
        "attendanceDate": "2024-09-15T00:00:00.000Z",
        "checkInTime": "2024-09-15T08:00:00.000Z",
        "checkOutTime": "2024-09-15T17:00:00.000Z",
        "status": "PRESENT",
        "isLocked": true
      }
    ],
    "summary": {
      "present": 12,
      "absent": 0,
      "late": 1,
      "onLeave": 1,
      "total": 14
    },
    "attendancePercentage": 93
  }
}
```

### Admin Update Staff Attendance
```
PATCH /api/staff-attendance/:id
Authorization: Bearer {adminToken}
Permission: academic:manage
Role: ADMIN+

{
  "status": "PRESENT",
  "remarks": "Admin correction: verified with security log"
}
```

---

## Attendance Flow

```
┌──────────────────────────────────────────────────────────────┐
│                 STUDENT ATTENDANCE FLOW                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. HOMEROOM TEACHER                                         │
│     GET /api/student-attendance/my-students                  │
│     → Get list of students for today's attendance            │
│                                                              │
│  2. TAKE ATTENDANCE                                          │
│     POST /api/student-attendance                             │
│     → Create session with all student records                │
│                                                              │
│  3. REVIEW & UPDATE                                          │
│     PATCH /api/student-attendance/my-sessions/:id/records/:id│
│     → Update individual records if needed                    │
│                                                              │
│  4. LOCK                                                     │
│     PATCH /api/student-attendance/my-sessions/:id/lock       │
│     → Finalize attendance for the day                        │
│                                                              │
│  5. STUDENT VIEWS                                            │
│     GET /api/student-attendance/my-attendance                │
│     → Student views their own attendance history             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 STAFF ATTENDANCE FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CHECK-IN                                                 │
│     POST /api/staff-attendance/check-in                      │
│     → Record arrival time & status                           │
│                                                              │
│  2. CHECK-OUT                                                │
│     POST /api/staff-attendance/check-out                     │
│     → Record departure time, auto-lock record                │
│                                                              │
│  3. VIEW HISTORY                                             │
│     GET /api/staff-attendance/my-attendance                  │
│     → Staff views their attendance history                   │
│                                                              │
│  4. ADMIN CORRECTION                                         │
│     PATCH /api/staff-attendance/:id                          │
│     → Admin can correct attendance records                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```