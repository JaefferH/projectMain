# Imam Hassen Medresa - School Management System
## System Architecture

### Overview
A comprehensive School Management System (SMS) built with Node.js/TypeScript backend, 
designed for managing all aspects of a school: students, teachers, academics, finance, 
attendance, assessments, and communication.

---

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Language** | TypeScript 5.x | Type-safe development |
| **Framework** | Express.js | HTTP server & routing |
| **Database** | PostgreSQL (Neon) | Primary data store |
| **ORM** | Prisma 6.x | Database access & migrations |
| **Cache** | Redis (Upstash) | Caching & rate limiting |
| **File Storage** | Cloudflare R2 (S3) | Document & photo storage |
| **Email** | Brevo (Sendinblue) | Transactional emails |
| **Messaging** | Telegram Bot API | Notifications & communication |
| **Auth** | JWT (Access + Refresh) | Authentication |
| **Validation** | Zod | Request validation |
| **Container** | Docker | Portable deployment |
| **Tunnel** | Cloudflare Tunnel | Public access |

---

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ React    │  │ Postman  │  │ Telegram │  │ Mobile (Future)│  │
│  │ Frontend │  │ (Testing)│  │   Bot    │  │               │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       │             │             │                 │           │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Express.js Server                        ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  ││
│  │  │   Auth   │ │   RBAC   │ │  Rate    │ │  Validation  │  ││
│  │  │Middleware│ │Middleware│ │ Limiter  │ │  (Zod)       │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    BUSINESS LOGIC                         │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │   │
│  │  │  Auth  │ │  User  │ │Academic│ │ Student│ │Finance │ │   │
│  │  │ Module │ │ Module │ │ Module │ │ Module │ │ Module │ │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────────┐ │   │
│  │  │Schedule│ │Attendance│ │Assessmt│ │  Announcement &   │ │   │
│  │  │ Module │ │ Module  │ │ Module │ │  Notification     │ │   │
│  │  └────────┘ └────────┘ └────────┘ └────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Postgres │  │  Redis   │  │Cloudflare│  │    Brevo     │   │
│  │  (Neon)  │  │ (Upstash)│  │    R2    │  │   (Email)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Module Structure

Each module follows a consistent structure:

```
src/modules/{module-name}/
├── {module}.controller.ts    # HTTP request handlers
├── {module}.service.ts       # Business logic
├── {module}.validation.ts    # Zod validation schemas
├── {module}.mapper.ts        # Data transformation
├── {module}.routes.ts        # Route definitions
└── {sub-modules}/            # Nested modules (if needed)
```

---

### Authentication Flow

```
1. User logs in → Gets Access Token (15min) + Refresh Token (30 days)
2. Access Token → Sent in Authorization header for all API calls
3. Token expires → Use Refresh Token to get new Access Token
4. Refresh expires → User must login again

Token Structure:
{
  userId: string,
  sessionId: string,
  iat: number,
  exp: number
}
```

---

### Authorization (RBAC)

**Roles:** SUPER_ADMIN → ADMIN → TEACHER → STUDENT

| Role | Permissions |
|------|------------|
| SUPER_ADMIN | Full system access, manage organizations |
| ADMIN | Manage users, academics, finance within organization |
| TEACHER | Manage students, assessments, attendance for assigned classes |
| STUDENT | View own grades, fees, timetable, attendance |

---

### Key Design Decisions

1. **Unified User Profile**: Single `UserProfile` model for all user types
2. **Multi-tenant**: Organization → Branch hierarchy
3. **Academic Year Structure**: Year → Term → Classroom
4. **Transaction Safety**: All critical operations use Prisma transactions
5. **Cache-First**: Redis caching on all GET endpoints with TTL-based invalidation
6. **Multi-Channel Notifications**: In-app + Telegram + Email
7. **Audit Logging**: All critical actions logged via AnnouncementLog

---

### API Conventions

```
GET    /api/resource          # List (paginated)
GET    /api/resource/:id      # Get by ID
POST   /api/resource          # Create
PATCH  /api/resource/:id      # Update
DELETE /api/resource/:id      # Delete

GET    /api/resource/my-xxx   # Current user's data
POST   /api/resource/bulk     # Bulk operations
```

**Response Format:**
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

**Pagination:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### Services Integration

| Service | Provider | Free Tier | Purpose |
|---------|----------|-----------|---------|
| PostgreSQL | Neon.tech | 0.5 GB | Primary database |
| Redis | Upstash | 256 MB | Caching & rate limiting |
| File Storage | Cloudflare R2 | 10 GB | Photos, documents |
| Email | Brevo | 300/day | Password reset, welcome |
| Telegram | Bot API | Unlimited | Notifications, guardian comms |

---

### Deployment Options

| Method | Cost | Best For |
|--------|------|----------|
| Docker + Cloudflare Tunnel | $0 | Development, testing |
| Fly.io | $0 (free tier) | Production |
| Oracle Cloud | $0 (free tier) | Production |
| Railway | $5 credit/month | Quick deploy |

---

### Performance Optimizations

1. **Redis Caching**: All GET endpoints cached (1-10 min TTL)
2. **Rate Limiting**: Redis-based, prevents abuse
3. **Connection Pooling**: Prisma connection pool for PostgreSQL
4. **Lazy Loading**: Related data loaded only when needed
5. **Transaction Optimization**: Heavy queries moved outside transactions