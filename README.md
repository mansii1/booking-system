# Booking system

Frontend is a mock booking screen (no API yet).
Backend is a small NestJS app plus Postgres in Docker. No booking routes yet — only a health check and the database tables.

---

## Folders

```
booking-system/
  docker-compose.yml     starts Postgres
  .env.example           copy this if you need a new .env
  frontend/              React UI (mock data)
  backend/
    .env                 database URL for the API
    db/init.sql          creates tables + 3 rooms
    src/
      main.ts            starts the API
      app.module.ts      lists the routes
      postgres.ts        database connection
      health.controller.ts   GET /health
      slot-length.ts     30 minute slots (used later)
```

---

## 1. Install Docker Desktop

The database runs inside Docker. You need Docker Desktop on Windows.

1. Download: https://www.docker.com/products/docker-desktop/
2. Install it. If it asks about WSL 2, leave that ticked.
3. Restart the PC if the installer asks.
4. Open **Docker Desktop** from the Start menu.
5. Wait until it says it is running (whale icon in the tray, not “Starting…”).

Open a **new** PowerShell and check:

```powershell
docker version
```

If you see version numbers, Docker is ready.

**If `docker` is not recognized:** Docker Desktop is not installed, or you did not open a new terminal after install.

**If you see `failed to connect to the docker API`:** Docker Desktop is installed but not running. Open it and wait.

---

## 2. Start the database

In PowerShell:

```powershell
cd E:\Mansi\booking-system
docker compose up -d
```

`-d` means it runs in the background.

Check it is up:

```powershell
docker compose ps
```

You should see a `postgres` container with status **running** or **healthy**.

First start also runs `backend/db/init.sql`. That creates:

- database name: `booking`
- tables: `resources`, `weekly_availability`, `bookings`
- 3 rooms (London, New York, Mumbai)

Login for this Docker database:

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `booking` |
| Username | `booking` |
| Password | `booking` |

---

## 3. See the data in pgAdmin

pgAdmin does not show this database until you add a **new server**. Your old “PostgreSQL 16” server is a different Postgres (the one installed on Windows). Use a new connection for Docker.

1. Open pgAdmin.
2. Right-click **Servers** → **Register** → **Server**.
3. **General** tab — Name: `booking-docker` (any name is fine).
4. **Connection** tab:
   - Host name/address: `localhost`
   - Port: `5432`
   - Maintenance database: `booking`
   - Username: `booking`
   - Password: `booking`
   - Tick **Save password**
5. Click **Save**.

Then open:

**Servers → booking-docker → Databases → booking → Schemas → public → Tables**

You should see:

- `resources`
- `weekly_availability`
- `bookings`

Right-click a table → **View/Edit Data** → **All Rows**.

Or open **Query Tool** and run:

```sql
SELECT * FROM resources;
SELECT * FROM weekly_availability;
SELECT * FROM bookings;
```

`resources` should have 3 rooms. `bookings` is empty until we add booking later.

### Port 5432 already in use

If Docker fails, or pgAdmin connects but you do **not** see the `booking` database, your local Postgres is probably already using port 5432.

Then either:

- Stop the local Postgres Windows service, then run `docker compose up -d` again, or
- Tell me and we can change Docker to another port (for example `5433`).

---

## 4. Run the backend API

```powershell
cd E:\Mansi\booking-system\backend
npm install
npm run start:dev
```

Check: http://localhost:3001/health

You should see `{ "ok": true }`. That means NestJS can talk to the Docker database.

The API `.env` is `backend/.env`. It must match the Docker user/password above.

---

## 5. Run the frontend

In a second terminal:

```powershell
cd E:\Mansi\booking-system\frontend
npm install
npm run dev
```

Open http://localhost:5173

This UI still uses mock data. It does not call the API yet.

---

## How to manage Docker day to day

| What you want | Command (from `E:\Mansi\booking-system`) |
|---|---|
| Start the database | `docker compose up -d` |
| Stop the database | `docker compose stop` |
| See if it is running | `docker compose ps` |
| See Postgres logs | `docker compose logs postgres` |

Data is stored in a Docker volume named `postgres_data`. Stopping Docker does not delete the rooms.

### Reset the database (run init.sql again)

`init.sql` only runs the **first** time the volume is created. If you change `init.sql` and want a fresh database:

```powershell
cd E:\Mansi\booking-system
docker compose down -v
docker compose up -d
```

`-v` deletes the volume. All tables and rows are created again from `init.sql`. You will lose any bookings (there are none yet).

---

## What is not built yet

- Booking API (create a booking, list slots)
- Connecting the React UI to the API
- The race test (two bookings at once)

That comes after this setup is working: Docker up, pgAdmin shows 3 rooms, `/health` returns ok.
