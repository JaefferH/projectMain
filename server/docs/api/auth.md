# Auth Module - API Reference

Base URL: `/api/auth`

## Overview
Handles authentication, password management, profile updates, and Telegram linking.

---

## Endpoints

### 1. Login
Authenticate user and receive access & refresh tokens.

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "username": "admin",
      "email": "admin@madrassa.local",
      "roles": ["SUPER_ADMIN"],
      "profileType": "ADMIN",
      "profile": {
        "id": "profile_id",
        "fullName": "System Administrator",
        "email": "admin@madrassa.local",
        "phone": "+251900000000",
        "photoUrl": null,
        "employeeNumber": "ADM-001",
        "registrationNumber": null,
        "branch": {
          "id": "branch_id",
          "name": "Main Campus",
          "code": "MAIN"
        }
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- `401` - Invalid username or password
- `403` - Account disabled

**Rate Limit:** 5 requests per minute

---

### 2. Get Current User Profile
Returns the authenticated user's full profile with roles and permissions.

```
GET /api/auth/me
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "user_id",
    "username": "admin",
    "email": "admin@madrassa.local",
    "organizationId": "org_id",
    "organization": {
      "id": "org_id",
      "name": "Imam Hassen Medresa",
      "code": "IHM"
    },
    "isActive": true,
    "lastLoginAt": "2024-08-11T10:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "roles": [
      {
        "id": "role_id",
        "name": "SUPER_ADMIN",
        "permissions": [
          { "id": "perm_id", "name": "user:create" },
          { "id": "perm_id", "name": "user:read" }
        ]
      }
    ],
    "profileType": "ADMIN",
    "profile": {
      "id": "profile_id",
      "fullName": "System Administrator",
      "fathersName": "Administrator",
      "mothersName": null,
      "gender": null,
      "nationalId": null,
      "phone": "+251900000000",
      "email": "admin@madrassa.local",
      "address": null,
      "photoUrl": null,
      "notes": null,
      "telegramChatId": "123456789",
      "employeeNumber": "ADM-001",
      "registrationNumber": null,
      "baseSalary": null,
      "hireDate": null,
      "admissionDate": null,
      "branch": {
        "id": "branch_id",
        "name": "Main Campus",
        "code": "MAIN"
      }
    }
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - User not found

---

### 3. Update Profile
Update the authenticated user's own profile information.

```
PATCH /api/auth/profile
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body (form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fullName | text | No | Full name |
| fathersName | text | No | Father's name |
| mothersName | text | No | Mother's name |
| gender | text | No | MALE, FEMALE, or OTHER |
| nationalId | text | No | National ID number |
| phone | text | No | Phone number |
| email | text | No | Email address |
| address | text | No | Physical address |
| notes | text | No | Additional notes |
| photo | file | No | Profile photo (image) |

**Example (JSON - without photo):**
```json
{
  "fullName": "Sumeya Besha Updated",
  "phone": "+251912345678",
  "address": "Bole, Addis Ababa"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_id",
    "username": "admin",
    "email": "admin@madrassa.local",
    "roles": [...],
    "profileType": "ADMIN",
    "profile": {
      "id": "profile_id",
      "fullName": "Sumeya Besha Updated",
      "phone": "+251912345678",
      "address": "Bole, Addis Ababa",
      "photoUrl": "https://pub-xxx.r2.dev/profile-photos/user-id/timestamp.jpg",
      ...
    }
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - Profile not found

---

### 4. Refresh Token
Get a new access token using a refresh token.

```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- `401` - Invalid or expired refresh token
- `401` - Session not found
- `401` - Session expired

---

### 5. Logout
Invalidate the current session.

```
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 6. Logout All Sessions
Invalidate all active sessions for the current user.

```
POST /api/auth/logout-all
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all sessions successfully"
}
```

---

### 7. Change Password
Change password for authenticated user. Requires current password.

```
POST /api/auth/change-password
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "Admin@123",
  "newPassword": "NewAdmin@456"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

**Error Responses:**
- `400` - Current password is incorrect
- `400` - New password same as current

**Note:** All active sessions are invalidated after password change.

---

### 8. Forgot Password
Request a password reset email.

```
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "admin@madrassa.local"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, we've sent a password reset link."
}
```

**Rate Limit:** 3 requests per minute
**Security:** Returns same message whether email exists or not (prevents enumeration).

---

### 9. Reset Password
Reset password using token from email.

```
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewAdmin@789"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

**Error Responses:**
- `400` - Invalid or expired reset token
- `400` - Reset token already used
- `400` - New password same as current

**Note:** Token expires in 1 hour. All sessions invalidated after reset.

---

### 10. Resend Reset Token
Resend password reset email (with cooldown).

```
POST /api/auth/resend-reset-token
```

**Request Body:**
```json
{
  "email": "admin@madrassa.local"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, we've sent a new password reset link."
}
```

**Rate Limit:** 2 requests per 2 minutes
**Cooldown:** 60 seconds between requests

---

### 11. Get Telegram Link Code
Generate a code to link Telegram account.

```
GET /api/auth/telegram-link-code
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Link code generated successfully.",
  "data": {
    "code": "A1B2C3D4",
    "expiresAt": "2024-08-11T10:30:00.000Z",
    "instructions": "Send this command to @YourBotUsername on Telegram: /link A1B2C3D4",
    "botLink": "https://t.me/YourBotUsername"
  }
}
```

**Usage:**
1. Get the code from this endpoint
2. Open Telegram, find the school bot
3. Send: `/link A1B2C3D4`
4. Account is linked

---

## Error Codes Reference

| Code | Description |
|------|-------------|
| 400 | Bad request - validation error |
| 401 | Unauthorized - invalid credentials or token |
| 403 | Forbidden - insufficient permissions |
| 404 | Not found - resource doesn't exist |
| 409 | Conflict - duplicate resource |
| 429 | Too many requests - rate limited |

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. LOGIN                                                    │
│     POST /api/auth/login                                     │
│     → Receive accessToken (15min) + refreshToken (30 days)  │
│                                                              │
│  2. USE API                                                  │
│     Authorization: Bearer {accessToken}                      │
│     → Access protected endpoints                             │
│                                                              │
│  3. TOKEN EXPIRED                                            │
│     POST /api/auth/refresh                                   │
│     Body: { refreshToken }                                   │
│     → Receive new accessToken + refreshToken                 │
│                                                              │
│  4. LOGOUT                                                   │
│     POST /api/auth/logout                                    │
│     Body: { refreshToken }                                   │
│     → Session invalidated                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```