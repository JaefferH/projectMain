# Teacher Assignment & Homeroom Module - API Reference

Base URLs: `/api/teacher-assignments`, `/api/homeroom-teachers`

## Overview
Manages two types of teacher-classroom relationships:
1. **Subject Teacher Assignment** - Teacher assigned to teach a specific subject in a classroom
2. **Homeroom Teacher** - Teacher responsible for overall class management, attendance, and report cards

---

## Subject Teacher Assignments

### List Teacher Assignments
```
GET /api/teacher-assignments?teacherId=profile_id&subjectId=subject_id&classroomId=classroom_id&academicTermId=term_id&academicYearId=year_id&branchId=branch_id&page=1&limit=10
Authorization: Bearer {accessToken}
Permission: academic:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher assignments retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "assignment_id",
        "teacherId": "teacher_profile_id",
        "subjectId": "subject_id",
        "classroomId": "classroom_id",
        "academicTermId": "term_id",
        "weeklyPeriods": 5,
        "createdAt": "2024-09-01T00:00:00.000Z",
        "teacher": {
          "id": "teacher_profile_id",
          "fullName": "Sumeya Besha",
          "employeeNumber": "TCH-001",
          "phone": "+251912345678",
          "email": "sumeya@school.com",
          "photoUrl": "https://pub-xxx.r2.dev/photos/..."
        },
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH-101"
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
          "assessments": 4,
          "timetableEntries": 5
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 75, "totalPages": 8 }
  }
}
```

### Get Teacher Assignment By ID
```
GET /api/teacher-assignments/:id
Permission: academic:read
```

### Create Teacher Assignment
```
POST /api/teacher-assignments
Permission: academic:manage
Role: ADMIN+

{
  "teacherId": "teacher_profile_id",
  "subjectId": "subject_id",
  "classroomId": "classroom_id",
  "academicTermId": "term_id",
  "weeklyPeriods": 5
}
```

**Validation Rules:**
- Teacher must have TEACHER, ADMIN, or SUPER_ADMIN role
- Subject must be active
- Classroom must belong to the same academic year as the term
- One teacher per subject per classroom per term (no duplicates)
- Only one subject teacher per classroom per term for each subject

**Error Response (409):**
```json
{
  "success": false,
  "message": "This teacher is already assigned to this subject and classroom for this term."
}
```

### Bulk Create Teacher Assignments
```
POST /api/teacher-assignments/bulk
Permission: academic:manage
Role: ADMIN+

{
  "assignments": [
    {
      "teacherId": "teacher_id",
      "subjectId": "math_subject_id",
      "classroomId": "classroom_10a_id",
      "academicTermId": "term_id",
      "weeklyPeriods": 5
    },
    {
      "teacherId": "teacher_id",
      "subjectId": "physics_subject_id",
      "classroomId": "classroom_10b_id",
      "academicTermId": "term_id",
      "weeklyPeriods": 4
    },
    {
      "teacherId": "teacher_id_2",
      "subjectId": "english_subject_id",
      "classroomId": "classroom_10a_id",
      "academicTermId": "term_id",
      "weeklyPeriods": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Created 2 assignments, 1 failed",
  "data": {
    "successful": [...],
    "failed": [
      {
        "assignment": { "teacherId": "...", ... },
        "error": "Another teacher is already assigned to this subject and classroom for this term."
      }
    ]
  }
}
```

### Update Teacher Assignment
```
PATCH /api/teacher-assignments/:id
Permission: academic:manage
Role: ADMIN+

{
  "weeklyPeriods": 6,
  "teacherId": "new_teacher_profile_id"
}
```

### Delete Teacher Assignment
```
DELETE /api/teacher-assignments/:id
Permission: academic:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has assessments or timetable entries.

---

## Teacher-Specific Views

### Get My Assignments (Teacher)
```
GET /api/teacher-assignments/my-assignments?academicTermId=term_id&academicYearId=year_id
Authorization: Bearer {teacherToken}
```

Returns teacher's own assignments grouped by academic term.

**Response:**
```json
{
  "success": true,
  "message": "Your assignments retrieved successfully.",
  "data": {
    "teacher": {
      "id": "teacher_profile_id",
      "fullName": "Sumeya Besha",
      "employeeNumber": "TCH-001",
      "phone": "+251912345678",
      "email": "sumeya@school.com"
    },
    "assignments": [...],
    "groupedByTerm": [
      {
        "term": {
          "id": "term_id",
          "name": "First Semester",
          "type": "SEMESTER_1",
          "startDate": "2024-09-01T00:00:00.000Z",
          "endDate": "2025-01-31T00:00:00.000Z",
          "isCurrent": true,
          "academicYear": { "id": "year_id", "name": "2024/2025" }
        },
        "assignments": [
          {
            "id": "assignment_id",
            "subject": { "id": "subject_id", "name": "Mathematics", "code": "MATH-101", "description": "..." },
            "classroom": { "id": "classroom_id", "name": "Grade 10-A", "capacity": 35, "branchName": "Main Campus" },
            "weeklyPeriods": 5,
            "stats": { "assessments": 4, "timetableEntries": 5 }
          }
        ]
      }
    ],
    "summary": {
      "totalAssignments": 3,
      "uniqueSubjects": 3,
      "uniqueClassrooms": 2,
      "currentTermAssignments": 3
    }
  }
}
```

### Get Assignments by Teacher
```
GET /api/teacher-assignments/teacher/:teacherId?academicYearId=year_id&academicTermId=term_id
Permission: academic:read
```

### Get Assignments by Classroom
```
GET /api/teacher-assignments/classroom/:classroomId
Permission: academic:read
```
Returns all subject teachers for a classroom with their subjects.

---

## Homeroom Teachers

### List Homeroom Teachers
```
GET /api/homeroom-teachers?academicTermId=term_id&academicYearId=year_id&branchId=branch_id&teacherId=profile_id&isActive=true&page=1&limit=10
Authorization: Bearer {accessToken}
Permission: academic:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Homeroom teachers retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "homeroom_id",
        "teacherId": "teacher_profile_id",
        "classroomId": "classroom_id",
        "academicTermId": "term_id",
        "isActive": true,
        "assignedAt": "2024-09-01T00:00:00.000Z",
        "createdAt": "2024-09-01T00:00:00.000Z",
        "teacher": {
          "id": "teacher_profile_id",
          "fullName": "Sumeya Besha",
          "employeeNumber": "TCH-001",
          "phone": "+251912345678",
          "email": "sumeya@school.com",
          "photoUrl": "https://..."
        },
        "classroom": {
          "id": "classroom_id",
          "name": "Grade 10-A",
          "capacity": 35,
          "branchName": "Main Campus",
          "studentCount": 35
        },
        "academicTerm": {
          "id": "term_id",
          "name": "First Semester",
          "type": "SEMESTER_1",
          "startDate": "2024-09-01T00:00:00.000Z",
          "endDate": "2025-01-31T00:00:00.000Z",
          "academicYear": "2024/2025"
        },
        "stats": {
          "attendanceSessions": 45,
          "students": 35
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 12, "totalPages": 2 }
  }
}
```

### Get Homeroom Teacher By ID
```
GET /api/homeroom-teachers/:id
Permission: academic:read
```

### Assign Homeroom Teacher
```
POST /api/homeroom-teachers
Permission: academic:manage
Role: ADMIN+

{
  "teacherId": "teacher_profile_id",
  "classroomId": "classroom_id",
  "academicTermId": "term_id"
}
```

**Rules:**
- **One homeroom teacher per classroom per term** (unique constraint)
- **One teacher can be homeroom for only one class per term** (unique constraint)
- Teacher must have TEACHER, ADMIN, or SUPER_ADMIN role
- Classroom must belong to the same academic year as the term

**Error Response (409):**
```json
{
  "success": false,
  "message": "This classroom already has an active homeroom teacher for this term."
}
```

```json
{
  "success": false,
  "message": "This teacher is already assigned as homeroom teacher for another classroom in this term."
}
```

### Update Homeroom Teacher
```
PATCH /api/homeroom-teachers/:id
Permission: academic:manage
Role: ADMIN+

{
  "teacherId": "new_teacher_profile_id",
  "isActive": true
}
```

### Deactivate Homeroom Teacher
```
PATCH /api/homeroom-teachers/:id/deactivate
Permission: academic:manage
Role: ADMIN+
```
Deactivates the assignment. A new homeroom teacher can then be assigned.

### Delete Homeroom Teacher
```
DELETE /api/homeroom-teachers/:id
Permission: academic:manage
Role: ADMIN+
```

---

## Homeroom-Specific Views

### Get My Homeroom Assignment (Teacher)
```
GET /api/homeroom-teachers/my-homeroom?academicTermId=term_id
Authorization: Bearer {teacherToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Your homeroom assignment retrieved successfully.",
  "data": {
    "teacher": {
      "id": "teacher_profile_id",
      "fullName": "Sumeya Besha",
      "employeeNumber": "TCH-001"
    },
    "hasHomeroomAssignment": true,
    "assignment": {
      "id": "homeroom_id",
      "classroom": { "id": "classroom_id", "name": "Grade 10-A", "capacity": 35, "studentCount": 35 },
      "academicTerm": { "id": "term_id", "name": "First Semester", "isCurrent": true },
      "stats": { "attendanceSessions": 45 }
    },
    "students": [
      {
        "id": "student_profile_id",
        "fullName": "Mohammed Ahmed",
        "registrationNumber": "STU-2024-001",
        "phone": "+251911223344",
        "email": "mohammed@example.com",
        "photoUrl": "https://..."
      }
    ],
    "summary": {
      "totalStudents": 35,
      "classroomCapacity": 35
    }
  }
}
```

### Get My Homeroom Teacher (Student)
```
GET /api/homeroom-teachers/my-homeroom-teacher?academicTermId=term_id
Authorization: Bearer {studentToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Your homeroom teacher retrieved successfully.",
  "data": {
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "hasEnrollment": true,
    "hasHomeroomTeacher": true,
    "enrollment": {
      "id": "enrollment_id",
      "classroom": { "id": "classroom_id", "name": "Grade 10-A", "capacity": 35 },
      "academicTerm": { "id": "term_id", "name": "First Semester", "isCurrent": true }
    },
    "homeroomTeacher": {
      "id": "homeroom_id",
      "teacher": {
        "id": "teacher_profile_id",
        "fullName": "Sumeya Besha",
        "employeeNumber": "TCH-001",
        "phone": "+251912345678",
        "email": "sumeya@school.com",
        "photoUrl": "https://..."
      },
      "assignedAt": "2024-09-01T00:00:00.000Z"
    },
    "subjectTeachers": [
      {
        "id": "assignment_id",
        "teacher": { "id": "teacher_id", "fullName": "Ahmed Teacher", "employeeNumber": "TCH-002" },
        "subject": { "id": "subject_id", "name": "Physics", "code": "PHY-101" },
        "weeklyPeriods": 4
      }
    ],
    "summary": {
      "totalSubjectTeachers": 8,
      "uniqueSubjects": 8
    }
  }
}
```

**Note:** Students see both their homeroom teacher AND all subject teachers.

### Get Homeroom Teacher by Classroom
```
GET /api/homeroom-teachers/classroom/:classroomId/term/:academicTermId
Permission: academic:read
```

---

## Two Types of Teacher Assignments

```
┌──────────────────────────────────────────────────────────────┐
│              TEACHER ASSIGNMENT TYPES                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SUBJECT TEACHER (TeacherAssignment)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Teacher: Sumeya Besha                                   │ │
│  │ Subject: Mathematics (MATH-101)                         │ │
│  │ Classroom: Grade 10-A                                   │ │
│  │ Term: First Semester 2024/2025                          │ │
│  │ Periods/Week: 5                                         │ │
│  │                                                         │ │
│  │ Responsibilities:                                       │ │
│  │ ✅ Teach the subject                                    │ │
│  │ ✅ Create assessments                                   │ │
│  │ ✅ Grade students                                       │ │
│  │ ✅ Appear in timetable                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  HOMEROOM TEACHER (HomeroomTeacher)                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Teacher: Sumeya Besha                                   │ │
│  │ Classroom: Grade 10-A                                   │ │
│  │ Term: First Semester 2024/2025                          │ │
│  │                                                         │ │
│  │ Responsibilities:                                       │ │
│  │ ✅ Take daily attendance                                │ │
│  │ ✅ Manage class overall                                 │ │
│  │ ✅ Prepare report cards                                 │ │
│  │ ✅ Communicate with parents                             │ │
│  │ ✅ Access all subject results for students              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  A teacher CAN be BOTH a subject teacher AND homeroom        │
│  teacher for the same or different classrooms.               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Assignment Rules Summary

| Rule | Subject Teacher | Homeroom Teacher |
|------|----------------|------------------|
| One per classroom per term | Per subject | One total |
| One teacher per assignment | Yes | Yes |
| Teacher must have teaching role | Yes | Yes |
| Can have multiple per term | Yes (different subjects/classes) | No (only one class) |
| Can be same person | Yes | Yes |
```