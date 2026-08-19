# Announcement & Notification Module - API Reference

Base URLs: `/api/announcements`, `/api/telegram`

## Overview
Unified announcement and notification system. Announcements can be published on the portal and optionally pushed as notifications via Telegram. Includes a multi-role Telegram bot.

---

## Announcements

### List Announcements (Admin)
```
GET /api/announcements?branchId=id&type=EVENT&priority=HIGH&isPublished=true&targetAudience=TEACHER&page=1&limit=10
Authorization: Bearer {accessToken}
Permission: notification:read
```

**Announcement Types:** GENERAL, ASSESSMENT, EXAM, FEE_DUE, FEE_PAID, ATTENDANCE, GRADE_POSTED, REPORT_CARD, EVENT, HOLIDAY, MEETING, EMERGENCY, SYSTEM

**Priority Levels:** LOW, NORMAL, HIGH, URGENT

**Target Audiences:** ALL, ADMIN, TEACHER, STUDENT

**Success Response (200):**
```json
{
  "success": true,
  "message": "Announcements retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "announcement_id",
        "branchId": "branch_id",
        "title": "Parent-Teacher Meeting",
        "content": "Dear parents, there will be a parent-teacher meeting on Friday at 3 PM. All parents are requested to attend.",
        "excerpt": "Parent-Teacher meeting this Friday at 3 PM",
        "type": "MEETING",
        "priority": "HIGH",
        "isPublished": true,
        "publishedAt": "2024-09-10T08:00:00.000Z",
        "startDate": "2024-09-10T00:00:00.000Z",
        "endDate": "2024-09-15T00:00:00.000Z",
        "targetAudience": ["ALL"],
        "sendPushNotification": true,
        "pushChannels": ["IN_APP", "TELEGRAM"],
        "createdAt": "2024-09-10T08:00:00.000Z",
        "branch": { "id": "branch_id", "name": "Main Campus", "code": "MAIN" },
        "publishedBy": { "id": "user_id", "username": "admin" },
        "stats": { "deliveries": 150, "views": 120 }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }
  }
}
```

### Get Announcement By ID
```
GET /api/announcements/:id
Permission: notification:read
```

### Get My Announcements (Portal View)
```
GET /api/announcements/my-announcements
Authorization: Bearer {accessToken}
```

Returns active announcements for the current user based on their role and branch. Automatically records views.

**Response:**
```json
{
  "success": true,
  "message": "Your announcements retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "announcement_id",
        "title": "Parent-Teacher Meeting",
        "content": "...",
        "type": "MEETING",
        "priority": "HIGH",
        "isViewed": true,
        "isRead": false,
        ...
      }
    ],
    "unreadCount": 3
  }
}
```

### Create Announcement
```
POST /api/announcements
Authorization: Bearer {accessToken}
Permission: notification:create
Role: ADMIN+
```

**Without Push Notification:**
```json
{
  "branchId": "branch_id",
  "title": "Welcome Back to School",
  "content": "Welcome back to the new academic year! Classes will begin on September 1st.",
  "type": "ANNOUNCEMENT",
  "priority": "NORMAL",
  "targetAudience": ["ALL"],
  "startDate": "2024-08-15T00:00:00.000Z",
  "endDate": "2024-09-15T00:00:00.000Z"
}
```

**With Push Notification (Portal + Telegram):**
```json
{
  "branchId": "branch_id",
  "title": "School Closed Tomorrow",
  "content": "Due to severe weather conditions, the school will be closed tomorrow. Stay safe.",
  "excerpt": "School closed tomorrow due to weather",
  "type": "EMERGENCY",
  "priority": "URGENT",
  "targetAudience": ["ALL"],
  "sendPushNotification": true,
  "pushChannels": ["IN_APP", "TELEGRAM"]
}
```

**Targeting Specific Roles:**
```json
{
  "branchId": "branch_id",
  "title": "Staff Meeting",
  "content": "All teachers must attend the staff meeting tomorrow at 2 PM.",
  "type": "MEETING",
  "priority": "HIGH",
  "targetAudience": ["TEACHER", "ADMIN"],
  "sendPushNotification": true,
  "pushChannels": ["TELEGRAM"]
}
```

**Targeting Specific Users:**
```json
{
  "branchId": "branch_id",
  "title": "Fee Reminder",
  "content": "Your tuition fee payment is due in 5 days.",
  "type": "FEE_DUE",
  "priority": "HIGH",
  "targetUserIds": ["user_id_1", "user_id_2"],
  "sendPushNotification": true,
  "pushChannels": ["TELEGRAM"]
}
```

**Targeting Specific Classrooms:**
```json
{
  "branchId": "branch_id",
  "title": "Exam Schedule Posted",
  "content": "The final exam schedule has been posted. Check your portal.",
  "type": "EXAM",
  "targetClassroomIds": ["classroom_10a_id"],
  "sendPushNotification": true,
  "pushChannels": ["IN_APP", "TELEGRAM"]
}
```

**Calendar Event:**
```json
{
  "branchId": "branch_id",
  "title": "Annual Sports Day",
  "content": "The Annual Sports Day will be held on August 20th. Events include football, basketball, and track & field.",
  "type": "EVENT",
  "priority": "HIGH",
  "targetAudience": ["ALL"],
  "eventDate": "2024-08-20T00:00:00.000Z",
  "eventStartTime": "08:00",
  "eventEndTime": "16:00",
  "eventLocation": "School Sports Field",
  "isAllDay": true,
  "color": "#007BFF",
  "notifyVia": "ALL"
}
```

**Scheduled Announcement:**
```json
{
  "branchId": "branch_id",
  "title": "Reminder: Fee Due Tomorrow",
  "content": "Monthly tuition fee is due tomorrow.",
  "type": "FEE_DUE",
  "priority": "HIGH",
  "targetAudience": ["STUDENT"],
  "sendPushNotification": true,
  "pushChannels": ["TELEGRAM"],
  "pushScheduledAt": "2024-09-05T08:00:00.000Z"
}
```

### Update Announcement
```
PATCH /api/announcements/:id
Permission: notification:create
Role: ADMIN+
```

### Delete Announcement
```
DELETE /api/announcements/:id
Permission: notification:create
Role: ADMIN+
```

### Mark Announcement as Read
```
PATCH /api/announcements/:id/read
Authorization: Bearer {accessToken}
```

### Mark All Announcements as Read
```
PATCH /api/announcements/read-all
Authorization: Bearer {accessToken}
```

---

## Delivery Tracking

Every announcement push notification is tracked:

```json
{
  "deliveryStats": {
    "total": 150,
    "delivered": 145,
    "read": 120
  }
}
```

**Delivery Statuses:** PENDING, SENT, DELIVERED, READ, FAILED

**Channels:** IN_APP, TELEGRAM, SMS, EMAIL

---

## Telegram Bot

### Bot Commands

| Command | Who Can Use | Description |
|---------|-------------|-------------|
| `/start` | All | Welcome & account linking |
| `/link CODE` | All | Link Telegram to portal account |
| `/status` | All | View linked profile(s) |
| `/menu` | All | Show role-specific commands |
| `/help` | All | Show all available commands |
| **Student Commands** |
| `/timetable` | Student | View class schedule |
| `/grades` | Student | View recent grades |
| `/fees` | Student | Check fee status |
| `/attendance` | Student | View attendance summary |
| `/assignments` | Student | View subjects & teachers |
| `/reportcard` | Student | Report card info |
| **Teacher/Staff Commands** |
| `/timetable` | Teacher | View teaching schedule |
| `/myclass` | Teacher | View homeroom class |
| `/attendance` | Staff | View own attendance |
| `/salary` | Staff | View salary info |
| `/assignments` | Teacher | View teaching load |
| **Admin Commands** |
| `/overview` | Admin | System overview |

---

## Telegram Integration

### Get Telegram Link Code
```
GET /api/auth/telegram-link-code
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Link code generated successfully.",
  "data": {
    "code": "A1B2C3D4",
    "expiresAt": "2024-08-11T10:30:00.000Z",
    "instructions": "Send this command to @YourBot on Telegram: /link A1B2C3D4",
    "botLink": "https://t.me/YourBot"
  }
}
```

### Guardian Telegram Link Code
```
POST /api/communication/guardian/:guardianId/link-code
Authorization: Bearer {adminToken}

Response:
{
  "code": "GUA-ABCD1234",
  "expiresAt": "...",
  "instructions": "Share with guardian: Send /link GUA-ABCD1234 to @YourBot on Telegram"
}
```

### Telegram Webhook
```
POST /api/telegram/webhook
Public endpoint (called by Telegram servers)

Setup:
POST /api/telegram/setup-webhook
Authorization: Bearer {adminToken}
```

---

## Multi-Role Telegram Linking

A single Telegram account can be linked to multiple roles:

```
One Telegram Account
├── 📚 Student: Sumeya (views own grades, fees, timetable)
├── 👨‍🏫 Staff: Sumeya (views teaching schedule, salary)
└── 👨‍👩‍👧 Guardian: Sumeya (views children's info)

Switch between roles using /menu command
```

---

## Push Notification Flow

```
┌──────────────────────────────────────────────────────────────┐
│              PUSH NOTIFICATION FLOW                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ADMIN CREATES ANNOUNCEMENT                               │
│     POST /api/announcements                                  │
│     { sendPushNotification: true, pushChannels: ["TELEGRAM"] }│
│                                                              │
│  2. SYSTEM DETERMINES RECIPIENTS                             │
│     - By targetAudience (ALL, TEACHER, STUDENT)              │
│     - By targetRoles (specific roles)                        │
│     - By targetUserIds (specific users)                      │
│     - By targetClassroomIds (specific classrooms)            │
│                                                              │
│  3. SYSTEM CHECKS TELEGRAM LINKING                           │
│     - Checks TelegramLink table (new multi-role system)      │
│     - Falls back to legacy telegramChatId field              │
│                                                              │
│  4. SYSTEM SENDS MESSAGES                                    │
│     - Sends via Telegram Bot API                             │
│     - Records delivery status                                │
│     - Logs successes and failures                            │
│                                                              │
│  5. RECIPIENTS RECEIVE                                       │
│     📱 Telegram message with emoji + title + content         │
│     Priority emojis: ℹ️ LOW, 📢 NORMAL, ⚠️ HIGH, 🚨 URGENT  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Calendar View

Announcements with event dates appear in the calendar:

```
GET /api/dashboard/calendar?month=8&year=2024
Authorization: Bearer {accessToken}
```

**Response includes events with:**
- Date, time, location
- Color coding by type
- All-day events
- Priority indicators