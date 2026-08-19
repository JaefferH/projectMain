# Deployment Guide

## Overview
This guide covers deploying the Imam Hassen School Management System in various environments.

---

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** (local or Neon cloud)
- **Redis** (local or Upstash cloud)
- **Docker** (optional, for containerized deployment)

---

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

# Email (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Imam Hassen Medresa

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=YourBotUsername

# Redis (Upstash)
REDIS_URL=https://xxx.upstash.io
REDIS_TOKEN=your-upstash-token

# File Storage (Cloudflare R2)
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=imam-hassen-school
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Client
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=production
```

---

## Local Development

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Set Up Database
```bash
# Push schema
npx prisma db push

# Seed data
npx prisma db seed
```

### 3. Start Development Server
```bash
npm run dev
```

Server runs at `http://localhost:5000`

### 4. Start Frontend (if applicable)
```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Docker Deployment

### 1. Build Docker Image
```bash
cd server
docker build -t imam-hassen-api .
```

### 2. Run Docker Container
```bash
docker run -p 5000:5000 --env-file .env imam-hassen-api
```

### 3. Using Docker Compose (with local PostgreSQL & Redis)
```bash
docker-compose up -d
```

---

## Cloud Deployment Options

### Option 1: Cloudflare Tunnel (Quickest - Free)

```bash
# 1. Start your server (local or Docker)
docker run -p 5000:5000 --env-file .env imam-hassen-api

# 2. Start Cloudflare tunnel
cloudflared tunnel --url http://localhost:5000

# You get: https://random-words.trycloudflare.com
```

### Option 2: Fly.io (Free Tier)

```bash
# 1. Install Fly CLI
brew install flyctl

# 2. Login
fly auth login

# 3. Launch
fly launch --name imam-hassen-api --region ams

# 4. Set secrets
fly secrets set DATABASE_URL="..." JWT_ACCESS_SECRET="..." ...

# 5. Deploy
fly deploy
```

### Option 3: Railway (Free Credit)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
railway up
```

---

## Database Migration

### Push Schema (Development)
```bash
npx prisma db push
```

### Run Migrations (Production)
```bash
npx prisma migrate deploy
```

### Seed Database
```bash
npx prisma db seed
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

---

## Post-Deployment Steps

### 1. Set Telegram Webhook
```bash
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://your-domain.com/api/telegram/webhook"
```

### 2. Verify Health Endpoint
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-08-11T10:00:00.000Z",
  "uptime": 3600,
  "redis": "connected",
  "storage": "cloudflare-r2"
}
```

### 3. Test Login
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

---

## Default Admin Credentials

```
Username: admin
Password: Admin@123
```

⚠️ **Change the default password immediately after first login!**

---

## Monitoring

### Health Check Endpoint
```
GET /api/health
```

### Docker Container Logs
```bash
docker logs <container-id>
```

### Fly.io Logs
```bash
fly logs
```

### Railway Logs
```bash
railway logs
```

---

## Backup & Restore

### Database Backup (Neon)
Neon provides automatic backups and point-in-time recovery.

### Database Backup (Manual)
```bash
pg_dump DATABASE_URL > backup.sql
```

### Restore
```bash
psql DATABASE_URL < backup.sql
```

---

## Scaling

| Component | Scaling Strategy |
|-----------|-----------------|
| API Server | Horizontal scaling (multiple containers) |
| Database | Neon scales automatically |
| Redis | Upstash scales automatically |
| File Storage | Cloudflare R2 (CDN) |

---

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db push

# Check connection string format
# Neon requires ?sslmode=require
```

### Redis Connection Issues
```bash
# Check if Redis URL is correct
# Upstash Redis URL format: https://xxx.upstash.io
```

### Docker Build Fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild
docker build --no-cache -t imam-hassen-api .
```

### TypeScript Errors
```bash
# Check tsconfig.json has:
"strict": false,
"skipLibCheck": true
```

### Transaction Timeout
```bash
# Increase timeout in prisma.ts:
transactionOptions: {
  timeout: 15000
}
```

---

## Free Tier Limits

| Service | Free Limit | Monitoring |
|---------|-----------|------------|
| Neon (PostgreSQL) | 0.5 GB storage | Dashboard |
| Upstash (Redis) | 256 MB, 10K commands/day | Dashboard |
| Cloudflare R2 | 10 GB storage | Dashboard |
| Brevo (Email) | 300 emails/day | Dashboard |
| Telegram Bot API | Unlimited | BotFather |
| Fly.io | 3 VMs, 3 GB storage | CLI/Dashboard |
| Railway | $5 credit/month | Dashboard |
| Cloudflare Tunnel | Unlimited | CLI |
```
