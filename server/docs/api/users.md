# User Module - API Reference

Base URL: `/api/users`

## Overview
Manages user accounts, profiles, roles, and permissions. All endpoints require authentication and proper authorization.

---

## Endpoints

### 1. List Users
Get paginated list of users with optional filters.

```
GET /api/users?page=1&limit=10&search=admin&isActive=true&roleId=role_id&branchId=branch_id
Authorization: Bearer {accessToken}
Permission: user:read
Role: ADMIN+
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| search | string | - | Search by username, email, fullName, phone |
| isActive | boolean | - | Filter by active status |
| roleId | string | - | Filter by role ID |
| branchId | string | - | Filter by branch ID |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "user_id",
        "username": "sumeya",
        "email": "sumeya@example.com",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "organizationId": "org_id",
        "roles": [
          {
            "id": "role_id",
            "name": "TEACHER",
            "permissions": [
              { "id": "perm_id", "name": "user:read" },
              { "id": "perm_id", "name": "student:create" }
            ]
          }
        ],
        "profileType": "TEACHER",
        "profile": {
          "id": "profile_id",
          "fullName": "Sumeya Besha",
          "fathersName": "Besha",
          "mothersName": "Fatima",
          "gender": "FEMALE",
          "nationalId": "ET12345678",
          "phone": "+251912345678",
          "email": "sumeya@example.com",
          "address": "Addis Ababa",
          "photoUrl": "https://pub-xxx.r2.dev/photos/...",
          "notes": null,
          "telegramChatId": "123456789",
          "employeeNumber": "TCH-001",
          "registrationNumber": null,
          "baseSalary": 15000,
          "hireDate": "2024-01-01T00:00:00.000Z",
          "admissionDate": null,
          "branchId": "branch_id",
          "branch": {
            "id": "branch_id",
            "name": "Main Campus",
            "code": "MAIN"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

---

### 2. Get User By ID
Get detailed information about a specific user.

```
GET /api/users/:id
Authorization: Bearer {accessToken}
Permission: user:read
Role: ADMIN+
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully.",
  "data": {
    "id": "user_id",
    "username": "sumeya",
    "email": "sumeya@example.com",
    "organizationId": "org_id",
    "organization": {
      "id": "org_id",
      "name": "Imam Hassen Medresa",
      "code": "IHM"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "roles": [...],
    "profileType": "TEACHER",
    "profile": { ... }
  }
}
```

**Error Responses:**
- `404` - User not found

---

### 3. Create User
Create a new user with role assignments and optional profile.

```
POST /api/users
Authorization: Bearer {accessToken}
Permission: user:create
Role: ADMIN+
```

**Request Body - Admin/Teacher:**
```json
{
  "organizationId": "org_id",
  "email": "newteacher@school.com",
  "roleIds": ["teacher_role_id"],
  "profileData": {
    "fullName": "Ahmed Mohammed",
    "fathersName": "Mohammed Ali",
    "mothersName": "Fatima Hassan",
    "gender": "MALE",
    "nationalId": "ET87654321",
    "phone": "+251911223344",
    "address": "Addis Ababa",
    "branchId": "branch_id",
    "employeeNumber": "TCH-002",
    "baseSalary": 12000,
    "hireDate": "2024-08-11T00:00:00.000Z"
  }
}
```

**Request Body - Student:**
```json
{
  "organizationId": "org_id",
  "email": "newstudent@school.com",
  "roleIds": ["student_role_id"],
  "profileData": {
    "fullName": "Mohammed Ahmed",
    "fathersName": "Ahmed Ali",
    "mothersName": "Aisha Omar",
    "gender": "MALE",
    "phone": "+251922334455",
    "address": "Addis Ababa",
    "branchId": "branch_id",
    "registrationNumber": "STU-2024-001",
    "admissionDate": "2024-09-01T00:00:00.000Z"
  }
}
```

**Request Body - Minimal (auto-generated username):**
```json
{
  "organizationId": "org_id",
  "email": "user@school.com",
  "roleIds": ["teacher_role_id"],
  "profileData": {
    "fullName": "New User",
    "fathersName": "Father Name",
    "branchId": "branch_id"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "id": "new_user_id",
    "username": "newteacher",
    "email": "newteacher@school.com",
    "roles": [...],
    "profileType": "TEACHER",
    "profile": { ... }
  }
}
```

**Error Responses:**
- `400` - Profile data required for ADMIN/TEACHER/STUDENT roles
- `403` - Cannot assign SUPER_ADMIN role
- `404` - One or more roles not found
- `409` - Username or email already exists

**Notes:**
- Username is auto-generated from email if not provided (e.g., `newteacher@school.com` → `newteacher`)
- Password is auto-generated if not provided
- Welcome email sent with credentials
- SUPER_ADMIN role cannot be assigned through this endpoint

---

### 4. Update User
Update user details, roles, and profile.

```
PATCH /api/users/:id
Authorization: Bearer {accessToken}
Permission: user:update
Role: ADMIN+
```

**Request Body:**
```json
{
  "username": "updated_username",
  "email": "updated@school.com",
  "isActive": true,
  "roleIds": ["role_id_1", "role_id_2"],
  "password": "NewPassword@123",
  "profileData": {
    "fullName": "Updated Name",
    "phone": "+251987654321",
    "address": "New Address"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully.",
  "data": { ... }
}
```

**Error Responses:**
- `403` - Insufficient permissions (role hierarchy)
- `403` - Cannot assign SUPER_ADMIN role
- `409` - Username or email already exists

**Role Hierarchy Rules:**
- SUPER_ADMIN can modify anyone
- ADMIN cannot modify SUPER_ADMIN
- ADMIN cannot modify other ADMINs
- Users cannot modify users with equal or higher role

---

### 5. Deactivate User (Soft Delete)
Deactivate a user account.

```
DELETE /api/users/:id
Authorization: Bearer {accessToken}
Permission: user:delete
Role: ADMIN+
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully.",
  "data": {
    "message": "User deactivated successfully.",
    "userId": "user_id",
    "action": "deactivated"
  }
}
```

**Error Responses:**
- `400` - User already deactivated
- `400` - Cannot deactivate own account
- `403` - Insufficient permissions
- `403` - Cannot deactivate SUPER_ADMIN

**Effects:**
- Sets `isActive: false`
- Invalidates all active sessions
- User cannot login

---

### 6. Permanently Delete User (Hard Delete)
Permanently remove a user and all related data.

```
DELETE /api/users/:id/permanent
Authorization: Bearer {accessToken}
Role: SUPER_ADMIN only
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User permanently deleted successfully.",
  "data": {
    "message": "User permanently deleted successfully.",
    "userId": "user_id",
    "action": "permanently_deleted",
    "summary": {
      "userId": "user_id",
      "username": "deleted_user",
      "email": "deleted@school.com",
      "roles": ["TEACHER"],
      "hadProfile": true
    }
  }
}
```

**Error Responses:**
- `400` - Cannot delete own account
- `403` - Only SUPER_ADMIN can permanently delete
- `403` - Cannot delete SUPER_ADMIN account

**Effects:**
- Deletes user record
- Deletes profile (cascade)
- Deletes role assignments
- Deletes sessions
- Deletes password reset tokens

---

### 7. Restore User (Reactivate)
Reactivate a deactivated user account.

```
PATCH /api/users/:id/restore
Authorization: Bearer {accessToken}
Permission: user:update
Role: ADMIN+
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User restored successfully.",
  "data": {
    "message": "User restored successfully.",
    "userId": "user_id",
    "action": "restored"
  }
}
```

**Error Responses:**
- `400` - User is already active
- `403` - Insufficient permissions

---

### 8. Bulk Delete Users
Deactivate multiple users at once.

```
POST /api/users/bulk/delete
Authorization: Bearer {accessToken}
Permission: user:delete
Role: ADMIN+
```

**Request Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bulk delete completed.",
  "data": {
    "successful": 2,
    "failed": 1,
    "results": [
      { "message": "User deactivated successfully.", "userId": "user_id_1", "action": "deactivated" },
      { "message": "User deactivated successfully.", "userId": "user_id_2", "action": "deactivated" }
    ],
    "errors": [
      { "userId": "user_id_3", "error": "Cannot deactivate SUPER_ADMIN account." }
    ]
  }
}
```

---

### 9. Bulk Hard Delete Users
Permanently delete multiple users.

```
POST /api/users/bulk/permanent-delete
Authorization: Bearer {accessToken}
Role: SUPER_ADMIN only
```

**Request Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2"]
}
```

---

### 10. Get Current User Permissions
Get permissions for the authenticated user.

```
GET /api/users/permissions
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User permissions retrieved successfully.",
  "data": {
    "roles": [
      { "id": "role_id", "name": "SUPER_ADMIN" }
    ],
    "permissions": [
      { "id": "perm_id", "name": "user:create" },
      { "id": "perm_id", "name": "user:read" },
      { "id": "perm_id", "name": "user:update" },
      { "id": "perm_id", "name": "user:delete" }
    ]
  }
}
```

---

## Role Hierarchy

```
SUPER_ADMIN (4) ← Full system access
    ↓
ADMIN (3) ← Organization-level access
    ↓
TEACHER (2) ← Class-level access
    ↓
STUDENT (1) ← Own data only
```

**Rules:**
- Higher roles can manage lower roles
- Cannot manage same or higher level
- SUPER_ADMIN can only be managed by another SUPER_ADMIN

---

## Profile Fields by Role

| Field | SUPER_ADMIN | ADMIN | TEACHER | STUDENT |
|-------|-------------|-------|---------|---------|
| fullName | ✅ | ✅ | ✅ | ✅ |
| fathersName | ✅ | ✅ | ✅ | ✅ |
| mothersName | ✅ | ✅ | ✅ | ✅ |
| gender | ✅ | ✅ | ✅ | ✅ |
| phone | ✅ | ✅ | ✅ | ✅ |
| address | ✅ | ✅ | ✅ | ✅ |
| employeeNumber | - | ✅ | ✅ | - |
| registrationNumber | - | - | - | ✅ |
| baseSalary | - | - | ✅ | - |
| hireDate | - | - | ✅ | - |
| admissionDate | - | - | - | ✅ |
```

---

## Roles Module

### List Roles
```
GET /api/roles?page=1&limit=10&search=admin
Permission: role:read
```

### Get Role By ID
```
GET /api/roles/:id
Permission: role:read
```

### Create Role
```
POST /api/roles
Permission: role:create
Role: SUPER_ADMIN only

{
  "name": "LIBRARIAN",
  "description": "Library management role",
  "permissionIds": ["perm_id_1", "perm_id_2"]
}
```

### Update Role
```
PATCH /api/roles/:id
Permission: role:update
Role: SUPER_ADMIN only
```

### Delete Role
```
DELETE /api/roles/:id
Permission: role:delete
Role: SUPER_ADMIN only
```
**Note:** Cannot delete system roles (SUPER_ADMIN, ADMIN, TEACHER, STUDENT)

### Get Role Users
```
GET /api/roles/:id/users?page=1&limit=10
Permission: role:read
```

### Assign Permissions to Role
```
POST /api/roles/:id/permissions
Permission: permission:manage
{
  "permissionIds": ["perm_id_1", "perm_id_2"]
}
```

### Remove Permission from Role
```
DELETE /api/roles/:id/permissions/:permissionId
Permission: permission:manage
```

---

## Permissions Module

### List Permissions
```
GET /api/permissions?page=1&limit=50&search=user&group=student
Permission: permission:read
```

### Get Permission Groups
```
GET /api/permissions/groups
Permission: permission:read
```

### Create Permission
```
POST /api/permissions
Permission: permission:manage
{
  "name": "library:create",
  "description": "Create library resources"
}
```

### Bulk Create Permissions
```
POST /api/permissions/bulk
Permission: permission:manage
{
  "permissions": [
    { "name": "library:create", "description": "Create library resources" },
    { "name": "library:read", "description": "View library resources" }
  ]
}
```

### Update Permission
```
PATCH /api/permissions/:id
Permission: permission:manage
```

### Delete Permission
```
DELETE /api/permissions/:id
Permission: permission:manage
```

---

## Complete Permissions List

| Permission | Description |
|-----------|-------------|
| **User Management** | |
| user:create | Create new users |
| user:read | View users |
| user:update | Update users |
| user:delete | Delete users |
| **Role Management** | |
| role:create | Create roles |
| role:read | View roles |
| role:update | Update roles |
| role:delete | Delete roles |
| **Permission Management** | |
| permission:read | View permissions |
| permission:manage | Manage permissions |
| **Organization** | |
| org:create | Create organizations |
| org:read | View organizations |
| org:update | Update organizations |
| org:delete | Delete organizations |
| **Branch** | |
| branch:create | Create branches |
| branch:read | View branches |
| branch:update | Update branches |
| branch:delete | Delete branches |
| **Student** | |
| student:create | Create/enroll students |
| student:read | View students |
| student:update | Update students |
| student:delete | Delete students |
| **Teacher** | |
| teacher:create | Create teacher assignments |
| teacher:read | View teachers |
| teacher:update | Update teacher assignments |
| teacher:delete | Delete teacher assignments |
| **Academic** | |
| academic:read | View academic data |
| academic:manage | Manage academic data |
| **Finance** | |
| finance:read | View financial data |
| finance:manage | Manage finances |
| **Notification** | |
| notification:read | View notifications |
| notification:create | Create notifications |
```