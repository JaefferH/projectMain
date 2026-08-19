# Communication Module - API Reference

Base URL: `/api/communication`

## Overview
Enables teachers to communicate with student guardians via Telegram. Teachers can send individual or bulk messages to guardians of students in their classes.

---

## Teacher-Guardian Communication

### Get Student Guardians (Teacher View)
```
GET /api/communication/student/:studentId/guardians
Authorization: Bearer {teacherToken}
```

Returns all guardians for a student with their Telegram status.

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
    },
    {
      "id": "guardian_id_2",
      "fullName": "Fatima Ali",
      "relationship": "Mother",
      "phone": "+251933445566",
      "hasTelegram": false,
      "isPrimary": false
    }
  ]
}
```

**Rules:**
- Teacher must teach the student's class OR be the homeroom teacher
- `hasTelegram` indicates if guardian can receive Telegram messages

---

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

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| studentId | string | Yes | Student profile ID |
| guardianId | string | Yes | Guardian ID |
| message | string | Yes | Message content (max 1000 chars) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully.",
  "data": {
    "id": "message_id",
    "status": "DELIVERED",
    "sentAt": "2024-09-15T10:30:00.000Z",
    "guardian": "Ahmed Mohammed",
    "student": "Mohammed Ahmed"
  }
}
```

**Statuses:** SENT, DELIVERED, READ, FAILED

**Error Responses:**
- `403` - Teacher doesn't have access to this student
- `400` - Guardian does not have Telegram linked

**Message Format (What Guardian Receives):**
```
📱 Message from Sumeya Besha
🏫 Imam Hassen Medresa

Student: Mohammed Ahmed (STU-2024-001)

📝 Your child has been doing well in class. Please ensure homework is completed on time.

You are welcome to come to the school to contact the teacher in person.
```

---

### Send Bulk Message to Class Guardians
```
POST /api/communication/send-bulk
Authorization: Bearer {teacherToken}

{
  "classroomId": "classroom_id",
  "message": "Parent-Teacher meeting this Friday at 3 PM. All parents are requested to attend.",
  "guardianIds": ["guardian_1_id", "guardian_2_id"]
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| classroomId | string | Yes | Classroom ID |
| message | string | Yes | Message content (max 1000 chars) |
| guardianIds | string[] | No | Specific guardians to send to (omit for all) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sent to 25 guardians, 3 failed",
  "data": {
    "message": "Sent to 25 guardians, 3 failed",
    "successful": 25,
    "failed": 3,
    "totalGuardians": 28
  }
}
```

**Rules:**
- Teacher must be homeroom teacher or teach a subject in the classroom
- Only guardians with Telegram linked will receive the message
- Failed deliveries are counted separately
- Message is personalized with guardian's name and children's names

**Personalized Message Format:**
```
👋 Dear Ahmed Mohammed,

Parent of: Mohammed Ahmed, Fatima Ali

📱 Message from Sumeya Besha
🏫 Imam Hassen Medresa
Class: Homeroom Teacher

📝 Parent-Teacher meeting this Friday at 3 PM. All parents are requested to attend.
```

---

### Get Message History
```
GET /api/communication/history/:studentId/:guardianId
Authorization: Bearer {teacherToken}
```

Returns the last 50 messages between a teacher and a guardian for a specific student.

**Response:**
```json
{
  "success": true,
  "message": "Message history retrieved.",
  "data": [
    {
      "id": "message_id",
      "message": "Your child has been doing well in class.",
      "status": "DELIVERED",
      "sentAt": "2024-09-15T10:30:00.000Z",
      "guardian": "Ahmed Mohammed",
      "student": "Mohammed Ahmed"
    },
    {
      "id": "message_id_2",
      "message": "Please ensure homework is completed on time.",
      "status": "READ",
      "sentAt": "2024-09-14T14:00:00.000Z",
      "guardian": "Ahmed Mohammed",
      "student": "Mohammed Ahmed"
    }
  ]
}
```

---

### Generate Guardian Telegram Link Code
```
POST /api/communication/guardian/:guardianId/link-code
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Guardian link code generated.",
  "data": {
    "guardianId": "guardian_id",
    "guardianName": "Ahmed Mohammed",
    "code": "GUA-ABCD1234",
    "expiresAt": "2024-09-15T11:00:00.000Z",
    "instructions": "Share with guardian: Send /link GUA-ABCD1234 to @YourBot on Telegram",
    "botLink": "https://t.me/YourBot"
  }
}
```

**Usage Flow:**
1. Admin generates link code for a guardian
2. Share the code with the guardian (SMS, in person, phone call)
3. Guardian opens Telegram, finds the school bot
4. Guardian sends: `/link GUA-ABCD1234`
5. Guardian's Telegram is linked to their guardian record
6. Teachers can now send messages to this guardian

**Error Responses:**
- `400` - Guardian already has Telegram linked
- `404` - Guardian not found

**Code Format:** `GUA-{random 8 characters}` (e.g., `GUA-ABCD1234`)
**Expiry:** 30 minutes

---

## Guardian Bot Commands

Once linked, guardians can use these Telegram commands:

| Command | Description |
|---------|-------------|
| `/children` | View linked children with details |
| `/child_grades` | View recent grades for all children |
| `/child_fees` | Check fee status for all children |
| `/child_attendance` | View attendance summary for all children |

**Example `/children` Response:**
```
👨‍👩‍👧 Your Children

Ahmed Mohammed (Father)

📚 Mohammed Ahmed
   Reg No: STU-2024-001

📚 Fatima Ali
   Reg No: STU-2024-002

Use:
/child_grades - View grades
/child_fees - Check fee status
/child_attendance - View attendance
```

**Example `/child_grades` Response:**
```
📊 Children's Recent Grades

📚 Mohammed Ahmed
   Term: First Semester
   🟢 Mathematics: 87%
   🟢 Physics: 82%
   🟡 English: 68%

📚 Fatima Ali
   Term: First Semester
   🟢 Mathematics: 92%
   🟢 English: 88%

Login to the portal for full results.
```

**Example `/child_fees` Response:**
```
💰 Children's Fee Status

📚 Mohammed Ahmed
   📋 Tuition Fee
      Amount: 5000 ETB
      Paid: 3000 ETB
      ⚠️ Balance: 2000 ETB
      Due: 2024-10-05

📚 Fatima Ali
   ✅ All fees paid

Total Family Balance: 2000 ETB

📌 Please pay at the school office or through bank transfer.
Contact the administration for payment arrangements.
```

**Example `/child_attendance` Response:**
```
📋 Children's Attendance

📚 Mohammed Ahmed
   🟢 Attendance: 93%
   ✅ Present: 28 | ❌ Absent: 2
   📊 Total Days: 30

📚 Fatima Ali
   🟢 Attendance: 97%
   ✅ Present: 29 | ❌ Absent: 0 | ⏰ Late: 1
   📊 Total Days: 30
```

---

## Communication Flow

```
┌──────────────────────────────────────────────────────────────┐
│           TEACHER-GUARDIAN COMMUNICATION FLOW                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SETUP (One-time per guardian):                              │
│                                                              │
│  1. ADMIN GENERATES LINK CODE                                │
│     POST /api/communication/guardian/:id/link-code           │
│     → Receives code (e.g., GUA-ABCD1234)                    │
│                                                              │
│  2. SHARE CODE WITH GUARDIAN                                 │
│     SMS, phone call, or in person                            │
│                                                              │
│  3. GUARDIAN LINKS TELEGRAM                                  │
│     Opens Telegram → Finds school bot                        │
│     Sends: /link GUA-ABCD1234                                │
│     → Guardian's Telegram is linked                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  DAILY USE:                                                  │
│                                                              │
│  1. TEACHER VIEWS STUDENT                                    │
│     GET /api/communication/student/:id/guardians             │
│     → Sees guardians with Telegram status                    │
│                                                              │
│  2. TEACHER SENDS MESSAGE                                    │
│     POST /api/communication/send-guardian                    │
│     → Guardian receives message on Telegram                  │
│                                                              │
│  3. TEACHER SENDS BULK MESSAGE                               │
│     POST /api/communication/send-bulk                        │
│     → All class guardians receive message                    │
│                                                              │
│  4. GUARDIAN CHECKS INFO                                     │
│     Uses bot commands: /children, /child_grades, etc.        │
│     → Gets real-time info about their children               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Access Control

| Action | Teacher | Homeroom Teacher | Admin |
|--------|---------|-----------------|-------|
| View student guardians | ✅ (own students) | ✅ (class students) | ✅ (all) |
| Send message to guardian | ✅ (own students) | ✅ (class students) | ✅ (all) |
| Send bulk message | ✅ (own classes) | ✅ (homeroom class) | ✅ (all) |
| View message history | ✅ (own messages) | ✅ (own messages) | ✅ (all) |
| Generate guardian link code | ❌ | ❌ | ✅ |

**"Own students"** = Students in classes where the teacher has a subject assignment.