# Assessment & Report Card Module - API Reference

Base URLs: `/api/assessments`, `/api/report-cards`

## Overview
Manages assessments (quizzes, tests, exams), grading, and report card generation. Subject teachers create assessments, homeroom teachers manage report cards.

---

## Assessments

### List Assessments
```
GET /api/assessments?classroomId=id&academicTermId=id&teacherAssignmentId=id&type=MID_EXAM&isPublished=true&page=1&limit=10
Authorization: Bearer {accessToken}
Permission: academic:read
```

**Assessment Types:** QUIZ, TEST, MID_EXAM, FINAL_EXAM, ASSIGNMENT, PROJECT, HOMEWORK, PARTICIPATION, OTHER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Assessments retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "assessment_id",
        "teacherAssignmentId": "assignment_id",
        "classroomId": "classroom_id",
        "academicTermId": "term_id",
        "title": "Mathematics Mid-Term Exam",
        "type": "MID_EXAM",
        "totalMarks": 50,
        "weight": 30,
        "assessmentDate": "2024-10-15T09:00:00.000Z",
        "isPublished": true,
        "publishedAt": "2024-10-16T00:00:00.000Z",
        "createdAt": "2024-10-10T00:00:00.000Z",
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH-101"
        },
        "teacher": {
          "id": "teacher_id",
          "fullName": "Sumeya Besha",
          "employeeNumber": "TCH-001"
        },
        "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
        "academicTerm": {
          "id": "term_id",
          "name": "First Semester",
          "academicYear": "2024/2025"
        },
        "stats": { "results": 35 }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
  }
}
```

### Get Assessment By ID
```
GET /api/assessments/:id
Permission: academic:read
```
Response includes all student results with marks and remarks.

### Create Assessment
```
POST /api/assessments
Authorization: Bearer {teacherToken}

{
  "teacherAssignmentId": "assignment_id",
  "classroomId": "classroom_id",
  "academicTermId": "term_id",
  "title": "Mathematics Mid-Term Exam",
  "type": "MID_EXAM",
  "totalMarks": 50,
  "weight": 30,
  "assessmentDate": "2024-10-15T09:00:00.000Z"
}
```

**Rules:**
- Teacher must own the teacher assignment
- `totalMarks`: Maximum score (e.g., 50 points)
- `weight`: Contribution to final grade in percentage (e.g., 30%)

### Add Assessment Results
```
POST /api/assessments/:id/results
Authorization: Bearer {teacherToken}

{
  "results": [
    { "enrollmentId": "enrollment_1_id", "marksObtained": 45, "remarks": "Excellent" },
    { "enrollmentId": "enrollment_2_id", "marksObtained": 38, "remarks": "Good" },
    { "enrollmentId": "enrollment_3_id", "marksObtained": 25, "remarks": "Needs improvement" }
  ]
}
```

**Rules:**
- Teacher must own the assessment
- Cannot modify published assessment results
- Percentage auto-calculated: `(marksObtained / totalMarks) * 100`
- Uses upsert (creates or updates existing results)

### Update Assessment Result
```
PATCH /api/assessments/results/:resultId
Authorization: Bearer {teacherToken}

{
  "marksObtained": 42,
  "remarks": "Updated after review"
}
```

### Publish Assessment
```
PATCH /api/assessments/:id/publish
Authorization: Bearer {teacherToken}
```
Makes results visible to students. Cannot publish without results.

### Delete Assessment
```
DELETE /api/assessments/:id
Authorization: Bearer {adminToken}
Permission: academic:manage
Role: ADMIN+
```
**Note:** Cannot delete published assessments.

---

## Student Assessment Views

### Get My Assessments (Student)
```
GET /api/assessments/my-assessments?academicTermId=term_id
Authorization: Bearer {studentToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Your assessments retrieved successfully.",
  "data": {
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
    "assessments": [
      {
        "id": "assessment_id",
        "title": "Mathematics Mid-Term Exam",
        "type": "MID_EXAM",
        "totalMarks": 50,
        "weight": 30,
        "assessmentDate": "2024-10-15T09:00:00.000Z",
        "isPublished": true,
        "subject": { "id": "subject_id", "name": "Mathematics", "code": "MATH-101" },
        "teacher": { "id": "teacher_id", "fullName": "Sumeya Besha" },
        "myResult": {
          "id": "result_id",
          "marksObtained": 45,
          "percentage": 90,
          "remarks": "Excellent"
        }
      }
    ],
    "summary": {
      "totalAssessments": 8,
      "assessmentsWithResults": 6
    }
  }
}
```

### Get My Assessment Result (Single)
```
GET /api/assessments/my-results/:assessmentId
Authorization: Bearer {studentToken}
```

### Get My Subject Results
```
GET /api/assessments/my-subject-results/:subjectId?academicTermId=term_id
Authorization: Bearer {studentToken}
```

**Response includes:**
- All assessments for the subject
- Individual results per assessment
- Overall percentage and letter grade

---

## Teacher Assessment Views

### Get My Teacher Assessments
```
GET /api/assessments/my-teacher-assessments?academicTermId=term_id
Authorization: Bearer {teacherToken}
```
Returns all assessments created by the teacher.

### Get Homeroom Class Assessments
```
GET /api/assessments/my-class-assessments?academicTermId=term_id
Authorization: Bearer {teacherToken}
```
Returns all assessments for the homeroom teacher's class (all subjects).

### Get Assessment Results (Full Class)
```
GET /api/assessments/:assessmentId/results
Authorization: Bearer {teacherToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment results retrieved successfully.",
  "data": {
    "assessment": {
      "id": "assessment_id",
      "title": "Mathematics Mid-Term Exam",
      "type": "MID_EXAM",
      "totalMarks": 50,
      "weight": 30,
      "subject": { "id": "subject_id", "name": "Mathematics" },
      "classroom": { "id": "classroom_id", "name": "Grade 10-A" }
    },
    "results": [
      {
        "id": "result_id",
        "enrollmentId": "enrollment_id",
        "marksObtained": 45,
        "percentage": 90,
        "remarks": "Excellent",
        "student": {
          "id": "student_id",
          "fullName": "Mohammed Ahmed",
          "registrationNumber": "STU-2024-001",
          "photoUrl": "https://..."
        }
      }
    ],
    "pendingStudents": [
      {
        "enrollmentId": "enrollment_id",
        "student": { "id": "student_id", "fullName": "Pending Student" }
      }
    ],
    "statistics": {
      "totalStudents": 35,
      "submittedResults": 33,
      "pendingResults": 2,
      "highest": 50,
      "lowest": 12,
      "average": 38.5,
      "passRate": 85
    }
  }
}
```

### Get Subject Results (Teacher View)
```
GET /api/assessments/subject/:subjectId/classroom/:classroomId/results?academicTermId=term_id
Authorization: Bearer {teacherToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Subject results retrieved successfully.",
  "data": {
    "subject": { "id": "subject_id", "name": "Mathematics", "code": "MATH-101" },
    "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
    "academicTerm": { "id": "term_id", "name": "First Semester" },
    "assessments": [
      { "id": "id", "title": "Quiz 1", "type": "QUIZ", "totalMarks": 20, "weight": 10 },
      { "id": "id", "title": "Mid-Term", "type": "MID_EXAM", "totalMarks": 50, "weight": 30 },
      { "id": "id", "title": "Final Exam", "type": "FINAL_EXAM", "totalMarks": 100, "weight": 60 }
    ],
    "students": [
      {
        "enrollmentId": "enrollment_id",
        "student": { "id": "id", "fullName": "Mohammed Ahmed", "registrationNumber": "STU-2024-001" },
        "results": [
          { "assessmentId": "id", "title": "Quiz 1", "marksObtained": 18, "percentage": 90 },
          { "assessmentId": "id", "title": "Mid-Term", "marksObtained": 45, "percentage": 90 },
          { "assessmentId": "id", "title": "Final Exam", "marksObtained": 85, "percentage": 85 }
        ],
        "overall": { "percentage": 87, "letterGrade": "A" }
      }
    ],
    "statistics": {
      "totalStudents": 35,
      "studentsWithResults": 33,
      "highest": 95,
      "lowest": 45,
      "average": 72.5,
      "passRate": 88
    }
  }
}
```

### Get Student All Results (Homeroom Teacher)
```
GET /api/assessments/student/:enrollmentId/all-results
Authorization: Bearer {teacherToken}
```
Returns all subject results for a specific student.

---

## Report Cards

### Get My Report Card (Student)
```
GET /api/report-cards/my-report-card?academicYearId=year_id
Authorization: Bearer {studentToken}
```

**Statuses:** not_generated, pending (draft), finalized

**Draft Response:**
```json
{
  "success": true,
  "message": "Your report card retrieved successfully.",
  "data": {
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "status": "pending",
    "message": "Your report card is being prepared. Please check back later.",
    "reportCard": null
  }
}
```

**Finalized Response:**
```json
{
  "success": true,
  "message": "Your report card retrieved successfully.",
  "data": {
    "student": {
      "id": "student_profile_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "status": "finalized",
    "reportCard": {
      "id": "report_card_id",
      "academicYear": { "id": "year_id", "name": "2024/2025" },
      "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
      "terms": [
        { "id": "term_1_id", "name": "First Semester" },
        { "id": "term_2_id", "name": "Second Semester" }
      ],
      "subjectGrades": [
        {
          "subject": { "id": "subject_id", "name": "Mathematics", "code": "MATH-101" },
          "teacher": { "id": "teacher_id", "fullName": "Sumeya Besha", "employeeNumber": "TCH-001" },
          "termGrades": {
            "term_1_id": { "termId": "term_1_id", "termName": "First Semester", "percentage": 87, "letterGrade": "A" },
            "term_2_id": { "termId": "term_2_id", "termName": "Second Semester", "percentage": 90, "letterGrade": "A+" }
          },
          "average": 88.5,
          "averageGrade": "A"
        }
      ],
      "overall": {
        "percentage": 86.75,
        "grade": "A",
        "rank": 5
      },
      "remarks": {
        "homeroom": "Good progress this year. Keep up the hard work!",
        "principal": "Well done on achieving excellent results."
      },
      "isFinalized": true
    }
  }
}
```

### Get Class Report Cards (Homeroom Teacher)
```
GET /api/report-cards/class-report-cards?academicYearId=year_id
Authorization: Bearer {teacherToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Class report cards retrieved successfully.",
  "data": {
    "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
    "academicYearId": "year_id",
    "students": [
      {
        "student": { "id": "id", "fullName": "Mohammed Ahmed" },
        "status": "finalized",
        "reportCard": { ... }
      },
      {
        "student": { "id": "id", "fullName": "Another Student" },
        "status": "draft",
        "reportCard": { ... }
      },
      {
        "student": { "id": "id", "fullName": "New Student" },
        "status": "not_generated",
        "reportCard": null
      }
    ],
    "summary": {
      "totalStudents": 35,
      "generatedCards": 30,
      "draftCards": 5,
      "finalizedCards": 25
    }
  }
}
```

### Get Student Report Card (Teacher/Admin)
```
GET /api/report-cards/student/:enrollmentId?academicYearId=year_id
Authorization: Bearer {teacherToken}
```

### Regenerate Report Card
```
POST /api/report-cards/enrollment/:enrollmentId/regenerate?academicYearId=year_id
Authorization: Bearer {teacherToken}
```
Deletes existing grades and recalculates. Cannot regenerate finalized cards.

### Finalize Report Card
```
PATCH /api/report-cards/:id/finalize
Authorization: Bearer {teacherToken}

{
  "homeroomRemarks": "Good progress this year. Keep up the hard work!",
  "principalRemarks": "Well done on achieving excellent results.",
  "remarks": "Overall satisfactory performance"
}
```

**Rules:**
- Only homeroom teacher or admin can finalize
- Cannot finalize without grades
- Once finalized, cannot be modified

---

## Grading System

### Letter Grade Scale
| Percentage | Grade |
|-----------|-------|
| 90-100 | A+ |
| 85-89 | A |
| 80-84 | A- |
| 75-79 | B+ |
| 70-74 | B |
| 65-69 | B- |
| 60-64 | C+ |
| 55-59 | C |
| 50-54 | D |
| 0-49 | F |

### Grade Calculation Formula
```
Subject Term Grade = Σ(Assessment Percentage × Weight) / Σ(Weights)

Example:
  Quiz 1:     90% × 10% = 9.0
  Mid-Term:   80% × 30% = 24.0
  Final Exam: 85% × 60% = 51.0
  ─────────────────────────────
  Final Grade: 84.0% → A-
```

### Report Card Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    REPORT CARD                              │
│                 Academic Year 2024/2025                     │
│                                                             │
│  Student: Mohammed Ahmed  |  Class: Grade 10-A             │
│                                                             │
│  ┌─────────────┬────────────┬────────────┬────────┬──────┐ │
│  │ Subject     │ Semester 1 │ Semester 2 │ Average│ Grade│ │
│  ├─────────────┼────────────┼────────────┼────────┼──────┤ │
│  │ Mathematics │    87%     │    90%     │  88.5% │  A   │ │
│  │ Physics     │    78%     │    82%     │  80.0% │  A-  │ │
│  │ English     │    92%     │    88%     │  90.0% │  A+  │ │
│  │ Chemistry   │    75%     │    80%     │  77.5% │  B+  │ │
│  ├─────────────┴────────────┴────────────┼────────┼──────┤ │
│  │ OVERALL                               │ 84.0%  │  A-  │ │
│  │ Rank: 5/35                            │        │      │ │
│  └───────────────────────────────────────┴────────┴──────┘ │
│                                                             │
│  Homeroom Teacher Remarks: Good progress!                   │
│  Principal Remarks: Well done!                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Assessment Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   ASSESSMENT FLOW                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SUBJECT TEACHER                                          │
│     POST /api/assessments                                    │
│     → Create assessment (Quiz, Test, Exam)                   │
│                                                              │
│  2. ADD RESULTS                                              │
│     POST /api/assessments/:id/results                        │
│     → Enter marks for each student                           │
│                                                              │
│  3. PUBLISH                                                  │
│     PATCH /api/assessments/:id/publish                       │
│     → Make results visible to students                       │
│                                                              │
│  4. STUDENT VIEWS                                            │
│     GET /api/assessments/my-assessments                      │
│     → Student sees their grades                              │
│                                                              │
│  5. REPORT CARD GENERATION                                   │
│     GET /api/report-cards/my-report-card                     │
│     → Auto-calculated from all published assessments         │
│                                                              │
│  6. HOMEROOM TEACHER                                         │
│     PATCH /api/report-cards/:id/finalize                     │
│     → Review and finalize report card                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```