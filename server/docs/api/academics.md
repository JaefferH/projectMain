# Academic Module - API Reference

Base URLs: `/api/academic-years`, `/api/academic-terms`, `/api/classrooms`, `/api/subjects`

## Overview
Manages the academic structure: Academic Years, Terms, Classrooms, Subjects, and Teacher Assignments.

---

## Academic Years

### List Academic Years
```
GET /api/academic-years?page=1&limit=10&branchId=branch_id&isCurrent=true&search=2024
Authorization: Bearer {accessToken}
Permission: academic:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Academic years retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "year_id",
        "branchId": "branch_id",
        "name": "2024/2025",
        "startDate": "2024-09-01T00:00:00.000Z",
        "endDate": "2025-06-30T00:00:00.000Z",
        "isCurrent": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "branch": {
          "id": "branch_id",
          "name": "Main Campus",
          "code": "MAIN"
        },
        "stats": {
          "terms": 2,
          "classrooms": 12,
          "feeStructures": 5
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
  }
}
```

### Get Academic Year By ID
```
GET /api/academic-years/:id
```

**Response includes:**
- Basic info
- List of terms
- Counts of classrooms, fee structures

### Create Academic Year
```
POST /api/academic-years
Permission: academic:manage
Role: ADMIN+

{
  "branchId": "branch_id",
  "name": "2025/2026",
  "startDate": "2025-09-01T00:00:00.000Z",
  "endDate": "2026-06-30T00:00:00.000Z",
  "isCurrent": false
}
```

**Name format:** `YYYY/YYYY` (e.g., "2025/2026")

### Update Academic Year
```
PATCH /api/academic-years/:id
Permission: academic:manage
Role: ADMIN+
```

### Delete Academic Year
```
DELETE /api/academic-years/:id
Permission: academic:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has terms, classrooms, or fee structures.

### Set Current Academic Year
```
PATCH /api/academic-years/:id/set-current
Permission: academic:manage
Role: ADMIN+
```
**Effect:** Unsets all other current years in the branch, sets this one as current.

---

## Academic Terms

### List Academic Terms
```
GET /api/academic-terms?academicYearId=year_id&isCurrent=true&type=SEMESTER_1
Permission: academic:read
```

### Get Academic Term By ID
```
GET /api/academic-terms/:id
Permission: academic:read
```

### Create Academic Term
```
POST /api/academic-terms
Permission: academic:manage
Role: ADMIN+

{
  "academicYearId": "year_id",
  "name": "First Semester",
  "type": "SEMESTER_1",
  "startDate": "2024-09-01T00:00:00.000Z",
  "endDate": "2025-01-31T00:00:00.000Z",
  "isCurrent": true
}
```

**Term Types:**
| Type | Description |
|------|-------------|
| SEMESTER_1 | First Semester |
| SEMESTER_2 | Second Semester |
| TRIMESTER_1 | First Trimester |
| TRIMESTER_2 | Second Trimester |
| TRIMESTER_3 | Third Trimester |
| QUARTER_1 | First Quarter |
| QUARTER_2 | Second Quarter |
| QUARTER_3 | Third Quarter |
| QUARTER_4 | Fourth Quarter |

**Rules:**
- One term type per academic year (e.g., only one SEMESTER_1 per year)
- Setting `isCurrent: true` unsets other current terms in the same year

### Update Academic Term
```
PATCH /api/academic-terms/:id
Permission: academic:manage
Role: ADMIN+
```

### Delete Academic Term
```
DELETE /api/academic-terms/:id
Permission: academic:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has student enrollments or teacher assignments.

---

## Classrooms

### List Classrooms
```
GET /api/classrooms?branchId=branch_id&academicYearId=year_id&search=Grade 10
Permission: academic:read
```

### Get Classroom By ID
```
GET /api/classrooms/:id
Permission: academic:read
```

**Response includes:**
- Basic info
- List of enrolled students
- List of teacher assignments
- Occupancy stats (capacity, current, available)

### Get Classrooms by Academic Year
```
GET /api/classrooms/academic-year/:academicYearId
Permission: academic:read
```

### Create Classroom
```
POST /api/classrooms
Permission: academic:manage
Role: ADMIN+

{
  "branchId": "branch_id",
  "academicYearId": "year_id",
  "name": "Grade 10-A",
  "capacity": 35
}
```

**Rules:**
- Classroom name must be unique within the academic year
- Academic year must belong to the branch
- Capacity is optional

### Update Classroom
```
PATCH /api/classrooms/:id
Permission: academic:manage
Role: ADMIN+

{
  "name": "Grade 10-B",
  "capacity": 40
}
```

### Delete Classroom
```
DELETE /api/classrooms/:id
Permission: academic:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has enrolled students or teacher assignments.

---

## Subjects

### List Subjects
```
GET /api/subjects?organizationId=org_id&branchId=branch_id&isActive=true&search=math
Permission: academic:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "subject_id",
        "organizationId": "org_id",
        "code": "MATH-101",
        "name": "Mathematics",
        "description": "Basic Mathematics for Grade 10",
        "isActive": true,
        "branchId": "branch_id",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "organization": {
          "id": "org_id",
          "name": "Imam Hassen Medresa",
          "code": "IHM"
        },
        "branch": {
          "id": "branch_id",
          "name": "Main Campus",
          "code": "MAIN"
        },
        "stats": {
          "teacherAssignments": 3
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }
  }
}
```

### Get Subject By ID
```
GET /api/subjects/:id
Permission: academic:read
```

### Create Subject
```
POST /api/subjects
Permission: academic:manage
Role: ADMIN+

{
  "organizationId": "org_id",
  "code": "PHY-101",
  "name": "Physics",
  "description": "Introduction to Physics",
  "branchId": "branch_id"
}
```

**Rules:**
- Code must be unique within the organization
- Code format: uppercase letters, numbers, hyphens
- Branch is optional (subject can be organization-wide)

### Update Subject
```
PATCH /api/subjects/:id
Permission: academic:manage
Role: ADMIN+
```

### Delete Subject
```
DELETE /api/subjects/:id
Permission: academic:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has teacher assignments.

### Toggle Subject Status
```
PATCH /api/subjects/:id/toggle-status
Permission: academic:manage
Role: ADMIN+
```

---

## Teacher Assignments

Base URL: `/api/teacher-assignments`

### List Teacher Assignments
```
GET /api/teacher-assignments?teacherId=profile_id&classroomId=classroom_id&academicTermId=term_id
Permission: academic:read
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

**Rules:**
- Teacher must have TEACHER/ADMIN/SUPER_ADMIN role
- Subject must be active
- Classroom must belong to the same academic year as the term
- One teacher per subject per classroom per term
- One subject teacher per classroom per term

### Bulk Create Teacher Assignments
```
POST /api/teacher-assignments/bulk
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
    }
  ]
}
```

### Update Teacher Assignment
```
PATCH /api/teacher-assignments/:id
Permission: academic:manage
```

### Delete Teacher Assignment
```
DELETE /api/teacher-assignments/:id
Permission: academic:manage
```
**Note:** Cannot delete if it has assessments or timetable entries.

### Get My Assignments (Teacher)
```
GET /api/teacher-assignments/my-assignments?academicTermId=term_id
Authorization: Bearer {teacherToken}
```
Returns teacher's own assignments grouped by academic term.

### Get Assignments by Teacher
```
GET /api/teacher-assignments/teacher/:teacherId?academicYearId=year_id
Permission: academic:read
```

### Get Assignments by Classroom
```
GET /api/teacher-assignments/classroom/:classroomId
Permission: academic:read
```

---

## Homeroom Teachers

Base URL: `/api/homeroom-teachers`

### List Homeroom Teachers
```
GET /api/homeroom-teachers?academicTermId=term_id&branchId=branch_id
Permission: academic:read
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
- One homeroom teacher per classroom per term
- One teacher can be homeroom for only one class per term
- Teacher must have teaching role

### Update Homeroom Teacher
```
PATCH /api/homeroom-teachers/:id
Permission: academic:manage
```

### Deactivate Homeroom Teacher
```
PATCH /api/homeroom-teachers/:id/deactivate
Permission: academic:manage
```

### Delete Homeroom Teacher
```
DELETE /api/homeroom-teachers/:id
Permission: academic:manage
```

### Get My Homeroom Assignment (Teacher)
```
GET /api/homeroom-teachers/my-homeroom?academicTermId=term_id
Authorization: Bearer {teacherToken}
```
Returns teacher's homeroom class with student list and attendance stats.

### Get My Homeroom Teacher (Student)
```
GET /api/homeroom-teachers/my-homeroom-teacher?academicTermId=term_id
Authorization: Bearer {studentToken}
```
Returns student's homeroom teacher and all subject teachers.

### Get Homeroom Teacher by Classroom
```
GET /api/homeroom-teachers/classroom/:classroomId/term/:academicTermId
Permission: academic:read
```

---

## Academic Structure

```
Organization
  └── Branch
       └── Academic Year (e.g., 2024/2025)
            ├── Academic Term (e.g., Semester 1)
            │    ├── Classroom (e.g., Grade 10-A)
            │    │    ├── Student Enrollments
            │    │    ├── Teacher Assignments (Subject Teachers)
            │    │    └── Homeroom Teacher (1 per class)
            │    └── Subjects
            └── Academic Term (e.g., Semester 2)
```