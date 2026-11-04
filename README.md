# ReachInbox Email Job Scheduler

Production-style email scheduler: schedule emails via API or dashboard, send them at the right time through BullMQ delayed jobs, with Redis-backed rate limiting, restart persistence, Slack alerts and Elasticsearch search. **No cron is used anywhere.**

## Stack
- **Backend:** TypeScript, Express, BullMQ, Redis, PostgreSQL (`pg`), Nodemailer (Ethereal SMTP), Elasticsearch, Bull Board
- **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript
- **Auth:** Google OAuth (Passport). **Slack:** OAuth v2 with incoming webhook

## Run locally

### Prerequisites
Node 20+, Docker Desktop, a Google OAuth client, a Slack app.

### 1. Infrastructure
```bash
docker compose up -d        # postgres, redis, elasticsearch
```
Create the tables:
```bash
# macOS/Linux
docker compose exec -T postgres psql -U postgres -d scheduler < backend/schema.sql
# Windows PowerShell
Get-Content backend\schema.sql | docker compose exec -T postgres psql -U postgres -d scheduler
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # fill in the values (see below)
npm install
npx tsx src/seedSenders.ts  # creates Ethereal sender accounts (once)
npm run dev                 # API on :4000
npm run worker              # BullMQ worker (separate terminal)
```
Ethereal accounts expire after a while. If sends fail with `535 Authentication failed`, run `npx tsx src/refreshSenders.ts`.

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

### Environment variables (`backend/.env`)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_HOST` | Redis host |
| `WORKER_CONCURRENCY` | Parallel jobs per worker (default 5) |
| `MIN_DELAY_MS` | Minimum gap between sends (default 2000) |
| `MAX_EMAILS_PER_HOUR_PER_SENDER` | Hourly cap per sender (default 100) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth; redirect URI `http://localhost:4000/auth/google/callback` |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | Slack app; redirect URL `http://localhost:4000/slack/callback`, scope `incoming-webhook` |
| `SESSION_SECRET` | Cookie signing secret |
| `FRONTEND_URL` / `BACKEND_URL` | Used for CORS and OAuth redirects |

### Ethereal setup
Senders are created programmatically through Ethereal's API (`seedSenders.ts`); no manual signup is needed. Sent mail never leaves Ethereal; preview it at https://ethereal.email/messages.

### Useful URLs
- Dashboard: http://localhost:3000
- Bull Board (live queue): http://localhost:4000/admin/queues
- Search: `GET /api/search?q=...` (login required)

## Architecture

### Scheduling
`POST /api/schedule` stores each lead as a row in Postgres (`status = scheduled`) and adds a BullMQ **delayed job** (`delay = scheduled_at - now`) with `jobId = email id`. Emails are spread over senders round-robin and spaced by the requested delay. A worker picks each job up when its delay expires.

### Persistence on restart
Delayed jobs live in Redis, so they survive an API or worker restart and still fire at the right time. On worker start, a **reconcile** step resets stale `sending` rows to `scheduled` and re-enqueues any `scheduled` row that has no job in Redis. This also recovers from a Redis flush. Postgres is the source of truth.

### Idempotency
- `jobId = email id`: BullMQ refuses to add a second job with the same id.
- The worker claims a row with `UPDATE ... WHERE status = 'scheduled'`. Only one worker gets the row, so a duplicate or replayed job exits without sending.

### Concurrency and delay between sends
- Worker concurrency is set by `WORKER_CONCURRENCY` (default 5).
- BullMQ limiter (`max: 1, duration: MIN_DELAY_MS`) enforces a **minimum of 2 seconds between sends** (configurable).

### Hourly rate limit
Per sender, enforced in Redis: key `rl:{senderId}:{hourWindowStart}`, incremented atomically with a Lua script (`INCR` plus `EXPIRE`). It is safe across multiple workers and instances. When the count exceeds the limit, the counter is rolled back and the job is **moved to the next hour window** (`moveToDelayed`, plus small jitter to keep order roughly stable). Jobs are never dropped or failed. The limit can also be set per batch from the Compose form.

### Behavior under load (1000+ emails at once)
All rows are stored and queued immediately as delayed jobs. The limiter plus the hourly counters meter actual sends, so excess jobs roll into later hours automatically. Retries use exponential backoff (3 attempts); failures are recorded on the row.

### Slack notification
Users connect Slack from the dashboard (OAuth v2). The incoming-webhook URL is stored per user. When a sender hits its hourly limit the worker posts a live message to that channel (once per sender per hour). If Slack isn't connected the notification is skipped silently, and connecting later works without a redeploy.

### Search
Every scheduled and sent email is indexed in Elasticsearch (re-indexed after sending) and searchable via `GET /api/search?q=` (fuzzy match on recipient, subject and body).

## Features
**Backend:** BullMQ delayed-job scheduler (no cron) · Postgres storage · restart recovery · idempotent sends · configurable concurrency · min delay between sends · Redis hourly limits per sender · multiple Ethereal senders · Slack OAuth + live alert · Elasticsearch search · Bull Board dashboard · Google OAuth sessions.

**Frontend:** Google login · header with name, email, avatar and logout · Scheduled and Sent tabs with loading, empty and error states · live refresh every 5 s · Compose modal (subject, body, CSV/text upload with detected lead count, start time, delay, hourly limit) · toasts · Connect/Disconnect Slack.

## Assumptions and trade-offs
- Ethereal accounts expire, so a refresh script is included.
- The rate limit is per sender, not per tenant.
- Rate-limit overflow keeps rough order only (jitter).
- A batch's hourly limit applies to the original jobs; recovered jobs fall back to the default from `.env`.
- Sessions use cookie-session; fine for the demo, not hardened for production.
- Dates are shown in the browser's local time.