# Booking system

Book 30-minute slots on shared rooms. Stack: React, NestJS, PostgreSQL.

Slot length is **30 minutes** (`backend/src/slot-length.ts`). Change that one number if they ask on the call.

---

## How to run

### 1. Database

**Option A — Docker** (what the repo is set up for):

```bash
docker compose up -d
```

This creates database `booking`, user `booking` / password `booking`, and runs `backend/db/init.sql` (tables + 3 rooms).

**Option B — Postgres you already have:** create a database named `booking`, then run `backend/db/init.sql` in pgAdmin (Query Tool on that database).

### 2. Env file

```bash
cp .env.example backend/.env
```

Edit `DATABASE_URL` if you used Option B (your username/password). If the password contains `@`, write it as `%40`.

### 3. API

```bash
cd backend
npm install
npm run start:dev
```

API: http://localhost:3001  
Rooms: http://localhost:3001/resources

### 4. UI

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — pick timezone, room, date, book a slot.

### 5. Race test (required)

Postgres must be up.

```bash
cd backend
npm test
```

Two bookings hit the same slot at once. One **201**, one **409**, and the table has **one** row.

---

## How double-booking is stopped

Not with a `SELECT` then `INSERT`. Postgres enforces it:

```sql
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
)
```

Same room + overlapping time → second insert fails (`23P01`). The API maps that to **409**.

`[)` means half-open: a slot ending at 10:00 and one starting at 10:00 do **not** overlap.

---

## Timezones and DST

- Bookings are stored as `timestamptz` (UTC instants). We never save “09:00” as if it were UTC.
- Each room has an IANA zone (`Europe/London`, `America/New_York`, `Asia/Kolkata`). Weekly hours are wall-clock time in **that** zone.
- Slots are built with **Luxon** (`DateTime.fromISO(..., { zone })`), so London 09:00 is `09:00Z` in winter and `08:00Z` in summer.
- The UI shows times in the **viewer’s** timezone; availability is still computed in the **room’s** timezone.

---

## Seed

Three rooms in `init.sql`: London (DST), New York (DST), Mumbai (no DST). London is Mon–Fri 09:00–17:00.

---

## Assumptions

- No login. `userId` on the request is enough (default `mansi`).
- No cancel, holidays, or exceptions — only a weekly pattern.
- You can use Docker or local Postgres; same `init.sql`.




