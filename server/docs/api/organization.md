# Organization & Branch Module - API Reference

Base URLs: `/api/organizations`, `/api/branches`

## Overview
Manages the multi-tenant structure: Organizations (school/institution) and Branches (campuses). This forms the top-level hierarchy of the system.

---

## Hierarchy

```
Organization (e.g., "Imam Hassen Medresa")
├── Branch 1 (e.g., "Main Campus - Addis Ababa")
├── Branch 2 (e.g., "Branch - Dire Dawa")
└── Branch 3 (e.g., "Branch - Adama")
```

---

## Organizations

### List Organizations
```
GET /api/organizations?page=1&limit=10&search=madrassa&isActive=true
Authorization: Bearer {accessToken}
Permission: org:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Organizations retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "org_id",
        "name": "Imam Hassen Medresa",
        "code": "IHM",
        "logoUrl": "https://pub-xxx.r2.dev/logos/ihm-logo.png",
        "email": "info@imamhassen.edu.et",
        "phone": "+251111234567",
        "website": "https://imamhassen.edu.et",
        "address": "Bole, Addis Ababa, Ethiopia",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "stats": {
          "branches": 3,
          "users": 500
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

### Get Organization By ID
```
GET /api/organizations/:id
Permission: org:read
```

**Response includes:**
- Organization details
- List of active branches
- Branch/user counts

### Create Organization
```
POST /api/organizations
Permission: org:create
Role: SUPER_ADMIN only

{
  "name": "Imam Hassen Medresa",
  "code": "IHM",
  "logoUrl": "https://example.com/logo.png",
  "email": "info@imamhassen.edu.et",
  "phone": "+251111234567",
  "website": "https://imamhassen.edu.et",
  "address": "Bole, Addis Ababa, Ethiopia"
}
```

**Rules:**
- Code must be unique (uppercase letters, numbers, underscores)
- Code format: `^[A-Z0-9_]+$`

**Minimal Request:**
```json
{
  "name": "New School",
  "code": "NEW"
}
```

### Update Organization
```
PATCH /api/organizations/:id
Permission: org:update
Role: SUPER_ADMIN only

{
  "name": "Imam Hassen Medresa International",
  "phone": "+251111234568",
  "email": "newemail@imamhassen.edu.et"
}
```

### Toggle Organization Status
```
PATCH /api/organizations/:id/toggle-status
Permission: org:update
Role: SUPER_ADMIN only
```
Toggles between active and inactive.

### Delete Organization
```
DELETE /api/organizations/:id
Permission: org:delete
Role: SUPER_ADMIN only
```
**Note:** Cannot delete if organization has active branches or users.

---

## Branches

### List Branches
```
GET /api/branches?page=1&limit=10&search=addis&isActive=true&organizationId=org_id&city=Addis Ababa
Authorization: Bearer {accessToken}
Permission: branch:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Branches retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "branch_id",
        "organizationId": "org_id",
        "name": "Main Campus - Addis Ababa",
        "code": "IHM-MAIN",
        "phone": "+251111234567",
        "email": "main@imamhassen.edu.et",
        "address": "Bole, Addis Ababa",
        "city": "Addis Ababa",
        "region": "Addis Ababa",
        "country": "Ethiopia",
        "isMainCampus": true,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "organization": {
          "id": "org_id",
          "name": "Imam Hassen Medresa",
          "code": "IHM"
        },
        "stats": {
          "users": 200,
          "profiles": 200,
          "classrooms": 12,
          "subjects": 25
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
  }
}
```

### Get Branch By ID
```
GET /api/branches/:id
Permission: branch:read
```

### Get Branches By Organization
```
GET /api/branches/organization/:organizationId
Permission: branch:read
```
Returns all active branches for an organization, ordered with main campus first.

### Create Branch
```
POST /api/branches
Permission: branch:create
Role: ADMIN+

// Main Campus:
{
  "organizationId": "org_id",
  "name": "Main Campus - Addis Ababa",
  "code": "IHM-MAIN",
  "phone": "+251111234567",
  "email": "main@imamhassen.edu.et",
  "address": "Bole, Addis Ababa",
  "city": "Addis Ababa",
  "region": "Addis Ababa",
  "country": "Ethiopia",
  "isMainCampus": true
}

// Branch Campus:
{
  "organizationId": "org_id",
  "name": "Branch - Dire Dawa",
  "code": "IHM-DD",
  "phone": "+251255678901",
  "email": "diredawa@imamhassen.edu.et",
  "address": "Kezira, Dire Dawa",
  "city": "Dire Dawa",
  "region": "Dire Dawa",
  "country": "Ethiopia",
  "isMainCampus": false
}
```

**Rules:**
- Code must be unique within the organization
- Code format: `^[A-Z0-9-]+$`
- Setting `isMainCampus: true` unsets other main campuses
- Country defaults to "Ethiopia"

### Update Branch
```
PATCH /api/branches/:id
Permission: branch:update
Role: ADMIN+

{
  "name": "Main Campus Updated",
  "phone": "+251111234568",
  "isMainCampus": true
}
```

### Delete Branch
```
DELETE /api/branches/:id
Permission: branch:delete
Role: SUPER_ADMIN only
```

**Cannot delete if branch has:**
- Users
- Student/teacher profiles
- Classrooms
- Subjects
- Expenses or expense categories
- Fee categories
- Guardians
- Revenues or revenue categories
- Schedule periods

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete branch because it has the following related records: 50 user(s), 200 profile(s), 12 classroom(s). Please remove or reassign these records first."
}
```

### Soft Delete Branch (Deactivate)
```
PATCH /api/branches/:id/soft-delete
Permission: branch:delete
Role: ADMIN+
```
Deactivates the branch without deleting data. Cannot deactivate main campus.

### Delete Branch with Reassignment
```
POST /api/branches/:id/delete-with-reassign
Permission: branch:delete
Role: ADMIN+

{
  "reassignToBranchId": "target_branch_id"
}
```

**Reassigns all data to target branch before deleting:**
- Users → Target branch
- Profiles → Target branch
- Classrooms → Target branch
- Subjects → Target branch
- Expenses → Target branch
- All other related records → Target branch

**Response:**
```json
{
  "success": true,
  "message": "Branch deleted successfully. All records reassigned to Main Campus - Addis Ababa.",
  "data": {
    "deletedBranch": {
      "id": "old_branch_id",
      "name": "Branch - Dire Dawa",
      "code": "IHM-DD"
    },
    "reassignedTo": {
      "id": "target_branch_id",
      "name": "Main Campus - Addis Ababa",
      "code": "IHM-MAIN"
    }
  }
}
```

**Rules:**
- Target branch must be in the same organization
- Target branch must be active
- Cannot reassign to the same branch
- Cannot delete main campus

### Toggle Branch Status
```
PATCH /api/branches/:id/toggle-status
Permission: branch:update
Role: ADMIN+
```
Toggles between active and inactive.

---

## Organization & Branch Flow

```
┌──────────────────────────────────────────────────────────────┐
│              ORGANIZATION & BRANCH SETUP                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CREATE ORGANIZATION                                      │
│     POST /api/organizations                                  │
│     → SUPER_ADMIN creates the school/institution             │
│                                                              │
│  2. CREATE MAIN CAMPUS                                       │
│     POST /api/branches                                       │
│     { isMainCampus: true }                                   │
│     → First branch becomes main campus                       │
│                                                              │
│  3. CREATE ADDITIONAL BRANCHES                               │
│     POST /api/branches                                       │
│     { isMainCampus: false }                                  │
│     → Additional campuses as needed                          │
│                                                              │
│  4. MANAGE BRANCHES                                          │
│     - Update branch info                                     │
│     - Toggle active/inactive                                 │
│     - Delete with reassignment when closing a branch         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Isolation

| Level | What's Isolated |
|-------|----------------|
| Organization | Complete data separation between organizations |
| Branch | Users, students, teachers, finances per branch |
| SUPER_ADMIN | Sees all organizations and branches |
| ADMIN | Sees their organization's branches |
| Others | See only their assigned branch |

---

## Branch Statistics

Each branch tracks:
```json
{
  "stats": {
    "users": 200,
    "profiles": 200,
    "classrooms": 12,
    "subjects": 25
  }
}
```

**Profile breakdown by role:**
- Student profiles (via student enrollments)
- Teacher profiles (via teacher assignments)
- Admin profiles (via admin role assignments)
```