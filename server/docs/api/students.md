# Student Module - API Reference

Base URLs: `/api/enrollments`, `/api/guardians`

## Overview
Manages student enrollments in classrooms and guardian/emergency contact information.

---

## Student Enrollments

### List Enrollments
```
GET /api/enrollments?studentId=profile_id&classroomId=classroom_id&academicTermId=term_id&isActive=true&page=1&limit=10
Authorization: Bearer {accessToken}
Permission: student:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Enrollments retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "enrollment_id",
        "studentId": "student_profile_id",
        "classroomId": "classroom_id",
        "academicTermId": "term_id",
        "enrollmentDate": "2024-09-01T00:00:00.000Z",
        "isActive": true,
        "createdAt": "2024-09-01T00:00:00.000Z",
        "student": {
          "id": "student_profile_id",
          "fullName": "Mohammed Ahmed",
          "registrationNumber": "STU-2024-001",
          "phone": "+251911223344",
          "email": "mohammed@example.com",
          "photoUrl": "https://pub-xxx.r2.dev/photos/..."
        },
        "classroom": {
          "id": "classroom_id",
          "name": "Grade 10-A",
          "capacity": 35,
          "branchName": "Main Campus"
        },
        "academicTerm": {
          "id": "term_id",
          "name": "First Semester",
          "type": "SEMESTER_1",
          "academicYear": "2024/2025"
        },
        "stats": {
          "assessmentResults": 12,
          "attendanceRecords": 45,
          "studentInvoices": 3
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 150, "totalPages": 15 }
  }
}
```

### Get Enrollment By ID
```
GET /api/enrollments/:id
Permission: student:read
```

### Get My Enrollments (Student)
```
GET /api/enrollments/my-enrollments?academicTermId=term_id
Authorization: Bearer {studentToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your enrollments retrieved successfully.",
  "data": {
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "enrollments": [
      {
        "id": "enrollment_id",
        "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
        "academicTerm": {
          "id": "term_id",
          "name": "First Semester",
          "type": "SEMESTER_1",
          "isCurrent": true,
          "academicYear": { "id": "year_id", "name": "2024/2025", "isCurrent": true }
        },
        "isActive": true
      }
    ],
    "summary": {
      "totalEnrollments": 3,
      "activeEnrollments": 1,
      "currentTermEnrollments": 1
    }
  }
}
```

### Get Class Enrollments (Teacher)
```
GET /api/enrollments/my-class-enrollments?academicTermId=term_id&isActive=true&search=mohammed
Authorization: Bearer {teacherToken}
```
Returns enrollments for the teacher's assigned classes.

### Create Enrollment
```
POST /api/enrollments
Permission: student:create
Role: ADMIN+

{
  "studentId": "student_profile_id",
  "classroomId": "classroom_id",
  "academicTermId": "term_id",
  "enrollmentDate": "2024-09-01T00:00:00.000Z"
}
```

**Rules:**
- Student must have STUDENT role
- Classroom must belong to the same academic year as the term
- Student cannot be enrolled twice in the same term
- Classroom capacity is checked (if set)

**Error Responses:**
- `400` - Student doesn't have STUDENT role
- `400` - Classroom at maximum capacity
- `400` - Classroom/term academic year mismatch
- `409` - Student already enrolled in this term

### Bulk Enroll Students
```
POST /api/enrollments/bulk
Permission: student:create
Role: ADMIN+

{
  "enrollments": [
    {
      "studentId": "student_1_id",
      "classroomId": "classroom_10a_id",
      "academicTermId": "term_id"
    },
    {
      "studentId": "student_2_id",
      "classroomId": "classroom_10a_id",
      "academicTermId": "term_id"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Enrolled 2 students, 1 failed",
  "data": {
    "successful": [...],
    "failed": [
      {
        "enrollment": { "studentId": "...", ... },
        "error": "Classroom has reached maximum capacity."
      }
    ]
  }
}
```

### Update Enrollment
```
PATCH /api/enrollments/:id
Permission: student:update
Role: ADMIN+

{
  "isActive": false,
  "classroomId": "new_classroom_id"
}
```

### Delete Enrollment
```
DELETE /api/enrollments/:id
Permission: student:delete
Role: ADMIN+
```
**Note:** Cannot delete if it has assessment results, attendance records, or invoices. Deactivate instead.

---

## Guardians

### List Guardians
```
GET /api/guardians?branchId=branch_id&search=ahmed&studentId=student_profile_id&page=1&limit=10
Permission: student:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Guardians retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "guardian_id",
        "branchId": "branch_id",
        "fullName": "Ahmed Mohammed",
        "relationship": "Father",
        "phone": "+251911234567",
        "alternativePhone": "+251922345678",
        "email": "ahmed@example.com",
        "occupation": "Engineer",
        "address": "Addis Ababa",
        "nationalId": "ET12345678",
        "telegramChatId": "987654321",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "branch": {
          "id": "branch_id",
          "name": "Main Campus",
          "code": "MAIN"
        },
        "stats": {
          "students": 2
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
  }
}
```

### Get Guardian By ID
```
GET /api/guardians/:id
Permission: student:read
```

**Response includes:**
- Guardian details
- Linked students with primary status

### Get My Guardians (Student)
```
GET /api/guardians/my-guardians
Authorization: Bearer {studentToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Your guardians retrieved successfully.",
  "data": {
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "guardians": [
      {
        "id": "guardian_id",
        "fullName": "Ahmed Mohammed",
        "relationship": "Father",
        "phone": "+251911234567",
        "alternativePhone": "+251922345678",
        "email": "ahmed@example.com",
        "occupation": "Engineer",
        "address": "Addis Ababa",
        "isPrimary": true
      },
      {
        "id": "guardian_id_2",
        "fullName": "Fatima Mohammed",
        "relationship": "Mother",
        "phone": "+251933445566",
        "isPrimary": false
      }
    ],
    "summary": {
      "totalGuardians": 2,
      "primaryGuardian": "Ahmed Mohammed"
    }
  }
}
```

### Get Guardians by Student
```
GET /api/guardians/student/:studentId
Permission: student:read
```

### Get Students & Guardians (Teacher's Classes)
```
GET /api/guardians/my-classes-students?academicTermId=term_id&search=mohammed
Authorization: Bearer {teacherToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Students and guardians retrieved successfully.",
  "data": {
    "teacher": {
      "id": "teacher_profile_id",
      "fullName": "Sumeya Besha",
      "employeeNumber": "TCH-001"
    },
    "classrooms": [
      {
        "classroom": {
          "id": "classroom_id",
          "name": "Grade 10-A"
        },
        "subjects": [
          { "id": "subject_id", "name": "Mathematics", "code": "MATH-101" }
        ],
        "students": [
          {
            "id": "student_profile_id",
            "fullName": "Mohammed Ahmed",
            "registrationNumber": "STU-2024-001",
            "phone": "+251911223344",
            "email": "mohammed@example.com",
            "photoUrl": "https://...",
            "guardians": [
              {
                "id": "guardian_id",
                "fullName": "Ahmed Mohammed",
                "relationship": "Father",
                "phone": "+251911234567",
                "isPrimary": true
              }
            ]
          }
        ]
      }
    ],
    "summary": {
      "totalClassrooms": 2,
      "totalStudents": 65,
      "totalGuardians": 120
    }
  }
}
```

### Create Guardian
```
POST /api/guardians
Permission: student:create
Role: ADMIN+

{
  "branchId": "branch_id",
  "fullName": "Ahmed Mohammed",
  "relationship": "Father",
  "phone": "+251911234567",
  "alternativePhone": "+251922345678",
  "email": "ahmed@example.com",
  "occupation": "Engineer",
  "address": "Addis Ababa",
  "nationalId": "ET12345678",
  "studentIds": ["student_1_id", "student_2_id"]
}
```

**Relationship values:** Father, Mother, Uncle, Aunt, Grandparent, Guardian, Other

### Update Guardian
```
PATCH /api/guardians/:id
Permission: student:update
Role: ADMIN+
```

### Delete Guardian
```
DELETE /api/guardians/:id
Permission: student:delete
Role: ADMIN+
```
**Note:** Cascade deletes StudentGuardian links.

### Link Guardian to Student
```
POST /api/guardians/link
Permission: student:update
Role: ADMIN+

{
  "guardianId": "guardian_id",
  "studentId": "student_profile_id",
  "isPrimary": true
}
```

**Rules:**
- Setting `isPrimary: true` unsets other primary guardians for that student
- One primary guardian per student

### Unlink Guardian from Student
```
DELETE /api/guardians/:guardianId/unlink/:studentId
Permission: student:update
Role: ADMIN+
```

---

## Guardian Telegram Communication

Base URL: `/api/communication`

### Get Student Guardians (Teacher View)
```
GET /api/communication/student/:studentId/guardians
Authorization: Bearer {teacherToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Guardians retrieved.",
  "data": [
    {
      "id": "guardian_id",
      "fullName": "Ahmed Mohammed",
      "relationship": "Father",
      "phone": "+251911234567",
      "hasTelegram": true,
      "isPrimary": true
    }
  ]
}
```

### Send Message to Guardian
```
POST /api/communication/send-guardian
Authorization: Bearer {teacherToken}

{
  "studentId": "student_profile_id",
  "guardianId": "guardian_id",
  "message": "Your child has been doing well in class. Please ensure homework is completed on time."
}
```

**Rules:**
- Teacher must teach the student's class or be homeroom teacher
- Guardian must have Telegram linked
- Message max 1000 characters

### Send Bulk Message to Class Guardians
```
POST /api/communication/send-bulk
Authorization: Bearer {teacherToken}

{
  "classroomId": "classroom_id",
  "message": "Parent-Teacher meeting this Friday at 3 PM. Please attend.",
  "guardianIds": ["guardian_1_id", "guardian_2_id"]  // Optional - specific guardians
}
```

### Get Message History
```
GET /api/communication/history/:studentId/:guardianId
Authorization: Bearer {teacherToken}
```

### Generate Guardian Telegram Link Code
```
POST /api/communication/guardian/:guardianId/link-code
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "message": "Guardian link code generated.",
  "data": {
    "guardianId": "guardian_id",
    "guardianName": "Ahmed Mohammed",
    "code": "GUA-ABCD1234",
    "expiresAt": "2024-08-11T11:00:00.000Z",
    "instructions": "Share with guardian: Send /link GUA-ABCD1234 to @YourBot on Telegram",
    "botLink": "https://t.me/YourBot"
  }
}
```

**Usage:**
1. Admin/teacher generates link code
2. Share code with guardian
3. Guardian sends `/link GUA-ABCD1234` to school Telegram bot
4. Guardian's Telegram is linked to their record

---

## Student-Guardian-Telegram Flow

```
┌──────────────────────────────────────────────────────────────┐
│              GUARDIAN TELEGRAM LINKING FLOW                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ADMIN/TEACHER                                            │
│     POST /api/communication/guardian/:id/link-code           │
│     → Receives link code (e.g., GUA-ABCD1234)               │
│                                                              │
│  2. SHARE WITH GUARDIAN                                      │
│     Give code to guardian (SMS, in person, phone call)       │
│                                                              │
│  3. GUARDIAN ON TELEGRAM                                     │
│     Find school bot (@YourBot)                               │
│     Send: /link GUA-ABCD1234                                 │
│     → Account linked!                                        │
│                                                              │
│  4. TEACHER COMMUNICATION                                    │
│     POST /api/communication/send-guardian                    │
│     → Guardian receives message on Telegram                  │
│                                                              │
│  5. GUARDIAN BOT COMMANDS                                    │
│     /children - View linked children                         │
│     /child_grades - View children's grades                   │
│     /child_fees - View children's fee status                 │
│     /child_attendance - View children's attendance           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```