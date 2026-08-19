# Schedule Module - API Reference

Base URLs: `/api/schedule-periods`, `/api/timetable-entries`

## Overview
Manages school schedule periods (class times) and weekly timetables for classes and teachers.

---

## Schedule Periods

### List Periods
```
GET /api/schedule-periods?branchId=branch_id&isBreak=false
Authorization: Bearer {accessToken}
Permission: academic:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Schedule periods retrieved successfully.",
  "data": [
    {
      "id": "period_id",
      "branchId": "branch_id",
      "name": "Period 1",
      "shortName": "P1",
      "order": 2,
      "startTime": "08:20",
      "endTime": "09:05",
      "isBreak": false,
      "duration": 45,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "branch": {
        "id": "branch_id",
        "name": "Main Campus",
        "code": "MAIN"
      },
      "stats": {
        "timetableEntries": 15
      }
    }
  ]
}
```

### Get Period By ID
```
GET /api/schedule-periods/:id
Permission: academic:read
```

### Create Period
```
POST /api/schedule-periods
Permission: academic:manage
Role: ADMIN+

{
  "branchId": "branch_id",
  "name": "Period 1",
  "shortName": "P1",
  "order": 2,
  "startTime": "08:20",
  "endTime": "09:05",
  "isBreak": false
}
```

**Rules:**
- Start time must be before end time
- Order must be unique within branch
- Cannot overlap with existing periods

### Bulk Create Periods (Typical School Day)
```
POST /api/schedule-periods/bulk
Permission: academic:manage
Role: ADMIN+

{
  "branchId": "branch_id",
  "periods": [
    { "name": "Morning Assembly", "shortName": "Assembly", "order": 1, "startTime": "08:00", "endTime": "08:20", "isBreak": false },
    { "name": "Period 1", "shortName": "P1", "order": 2, "startTime": "08:20", "endTime": "09:05", "isBreak": false },
    { "name": "Period 2", "shortName": "P2", "order": 3, "startTime": "09:05", "endTime": "09:50", "isBreak": false },
    { "name": "Short Break", "shortName": "Break", "order": 4, "startTime": "09:50", "endTime": "10:10", "isBreak": true },
    { "name": "Period 3", "shortName": "P3", "order": 5, "startTime": "10:10", "endTime": "10:55", "isBreak": false },
    { "name": "Period 4", "shortName": "P4", "order": 6, "startTime": "10:55", "endTime": "11:40", "isBreak": false },
    { "name": "Lunch Break", "shortName": "Lunch", "order": 7, "startTime": "11:40", "endTime": "12:30", "isBreak": true },
    { "name": "Period 5", "shortName": "P5", "order": 8, "startTime": "12:30", "endTime": "13:15", "isBreak": false },
    { "name": "Period 6", "shortName": "P6", "order": 9, "startTime": "13:15", "endTime": "14:00", "isBreak": false }
  ]
}
```

**Note:** This replaces all existing periods for the branch.

### Update Period
```
PATCH /api/schedule-periods/:id
Permission: academic:manage
Role: ADMIN+

{
  "name": "Period 1 Extended",
  "endTime": "09:10"
}
```

### Delete Period
```
DELETE /api/schedule-periods/:id
Permission: academic:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has timetable entries.

---

## Timetable Entries

### List Timetable Entries
```
GET /api/timetable-entries?classroomId=id&teacherAssignmentId=id&dayOfWeek=MONDAY&academicTermId=id
Permission: academic:read
```

**Days:** MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY

**Success Response (200):**
```json
{
  "success": true,
  "message": "Timetable entries retrieved successfully.",
  "data": [
    {
      "id": "entry_id",
      "teacherAssignmentId": "assignment_id",
      "schedulePeriodId": "period_id",
      "classroomId": "classroom_id",
      "dayOfWeek": "MONDAY",
      "room": "Room 101",
      "isActive": true,
      "period": {
        "id": "period_id",
        "name": "Period 1",
        "shortName": "P1",
        "order": 2,
        "startTime": "08:20",
        "endTime": "09:05"
      },
      "teacher": {
        "id": "teacher_id",
        "fullName": "Sumeya Besha",
        "employeeNumber": "TCH-001"
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
      }
    }
  ]
}
```

### Get Timetable Entry By ID
```
GET /api/timetable-entries/:id
Permission: academic:read
```

### Create Timetable Entry
```
POST /api/timetable-entries
Permission: academic:manage
Role: ADMIN+

{
  "teacherAssignmentId": "assignment_id",
  "schedulePeriodId": "period_id",
  "classroomId": "classroom_id",
  "dayOfWeek": "MONDAY",
  "room": "Room 101"
}
```

**Rules:**
- Cannot schedule during break periods
- One teacher assignment per period per day
- One classroom per period per day (no double-booking)
- Teacher cannot be in two places at same period
- Classroom must match teacher assignment's classroom

### Bulk Create Timetable (Weekly Schedule)
```
POST /api/timetable-entries/bulk
Permission: academic:manage
Role: ADMIN+

{
  "entries": [
    {
      "teacherAssignmentId": "math_assignment_id",
      "schedulePeriodId": "period_2_id",
      "classroomId": "classroom_10a_id",
      "dayOfWeek": "MONDAY",
      "room": "Room 101"
    },
    {
      "teacherAssignmentId": "physics_assignment_id",
      "schedulePeriodId": "period_3_id",
      "classroomId": "classroom_10a_id",
      "dayOfWeek": "MONDAY",
      "room": "Lab 1"
    },
    {
      "teacherAssignmentId": "math_assignment_id",
      "schedulePeriodId": "period_2_id",
      "classroomId": "classroom_10a_id",
      "dayOfWeek": "TUESDAY",
      "room": "Room 101"
    }
  ]
}
```

### Update Timetable Entry
```
PATCH /api/timetable-entries/:id
Permission: academic:manage
Role: ADMIN+

{
  "room": "Room 205",
  "isActive": false
}
```

### Delete Timetable Entry
```
DELETE /api/timetable-entries/:id
Permission: academic:manage
Role: ADMIN+
```

---

## Student Timetable

### Get My Timetable (Student)
```
GET /api/timetable-entries/my-timetable?academicTermId=term_id
Authorization: Bearer {studentToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your timetable retrieved successfully.",
  "data": {
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "hasTimetable": true,
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
    "timetable": {
      "MONDAY": [
        {
          "id": "entry_id",
          "dayOfWeek": "MONDAY",
          "period": { "id": "period_id", "name": "Period 1", "shortName": "P1", "startTime": "08:20", "endTime": "09:05" },
          "subject": { "id": "subject_id", "name": "Mathematics", "code": "MATH-101", "description": "..." },
          "teacher": { "id": "teacher_id", "fullName": "Sumeya Besha", "employeeNumber": "TCH-001", "phone": "...", "email": "...", "photoUrl": "..." },
          "room": "Room 101"
        }
      ],
      "TUESDAY": [...],
      "WEDNESDAY": [...],
      "THURSDAY": [...],
      "FRIDAY": [...]
    },
    "summary": {
      "totalPeriodsPerWeek": 30,
      "uniqueSubjects": 8,
      "uniqueTeachers": 8
    }
  }
}
```

---

## Teacher Timetable

### Get My Teacher Timetable
```
GET /api/timetable-entries/my-teacher-timetable?academicTermId=term_id
Authorization: Bearer {teacherToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your timetable retrieved successfully.",
  "data": {
    "teacher": {
      "id": "teacher_profile_id",
      "fullName": "Sumeya Besha",
      "employeeNumber": "TCH-001"
    },
    "hasTimetable": true,
    "academicTerms": [
      { "id": "term_id", "name": "First Semester", "academicYear": { "id": "year_id", "name": "2024/2025" } }
    ],
    "timetable": {
      "MONDAY": [
        {
          "id": "entry_id",
          "dayOfWeek": "MONDAY",
          "period": { "id": "period_id", "name": "Period 1", "shortName": "P1", "startTime": "08:20", "endTime": "09:05" },
          "subject": { "id": "subject_id", "name": "Mathematics", "code": "MATH-101", "description": "..." },
          "classroom": { "id": "classroom_id", "name": "Grade 10-A", "capacity": 35 },
          "room": "Room 101"
        }
      ]
    },
    "summary": {
      "totalPeriodsPerWeek": 24,
      "uniqueSubjects": 3,
      "uniqueClassrooms": 3
    }
  }
}
```

---

## Typical School Schedule Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   WEEKLY TIMETABLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Periods (defined once per branch):                         │
│  ┌──────┬────────────┬──────────┬──────────┐               │
│  │ Order│ Name       │ Start    │ End      │               │
│  ├──────┼────────────┼──────────┼──────────┤               │
│  │  1   │ Assembly   │ 08:00    │ 08:20    │               │
│  │  2   │ Period 1   │ 08:20    │ 09:05    │               │
│  │  3   │ Period 2   │ 09:05    │ 09:50    │               │
│  │  4   │ Short Break│ 09:50    │ 10:10    │ (isBreak)     │
│  │  5   │ Period 3   │ 10:10    │ 10:55    │               │
│  │  6   │ Period 4   │ 10:55    │ 11:40    │               │
│  │  7   │ Lunch Break│ 11:40    │ 12:30    │ (isBreak)     │
│  │  8   │ Period 5   │ 12:30    │ 13:15    │               │
│  │  9   │ Period 6   │ 13:15    │ 14:00    │               │
│  └──────┴────────────┴──────────┴──────────┘               │
│                                                             │
│  Timetable (per classroom, per term):                       │
│  ┌─────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ Period  │ MONDAY   │ TUESDAY  │ WEDNESDAY│ THURSDAY │   │
│  ├─────────┼──────────┼──────────┼──────────┼──────────┤   │
│  │ P1      │ Math     │ English  │ Physics  │ Math     │   │
│  │ P2      │ Physics  │ Math     │ English  │ Chemistry│   │
│  │ P3      │ English  │ Chemistry│ Math     │ Physics  │   │
│  │ ...     │ ...      │ ...      │ ...      │ ...      │   │
│  └─────────┴──────────┴──────────┴──────────┴──────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Conflict Prevention Rules

| Rule | Description |
|------|-------------|
| No break booking | Cannot schedule classes during break periods |
| Teacher conflict | Same teacher can't be in two places at once |
| Classroom conflict | Same classroom can't be used by two classes at once |
| Subject conflict | Same subject can't be taught twice in same period |
```