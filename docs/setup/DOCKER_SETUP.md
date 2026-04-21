# Docker Container Deployment

This guide explains how to set up and run the full Chenda stack (database, backend API, frontend) using Docker and Docker Compose. The entire environment is defined in code, so it works identically on any machine with Docker installed — no local PostgreSQL, Node, or Python installation required.

---

## How Migrations and Seeds Relate to Docker

Understanding these two processes and their place in the Docker lifecycle is important before running anything.

### The three-stage pipeline

```
 docker compose up -d          →  containers start, DB volume is empty
        ↓
 run migrations                →  creates the database schema (tables, indexes, etc.)
        ↓
 run seeds (optional)          →  inserts mock data for development/testing
```

**This pipeline only needs to run once per fresh volume.** Data survives container restarts and rebuilds because it lives in the named `postgres_data` Docker volume — not inside the container filesystem. If you destroy the volume (`docker compose down -v`), you must run the pipeline again from scratch.

### Migrations

| Property | Detail |
|---|---|
| Script | `migrations/migrate.js` |
| What it does | Creates all tables, indexes, the session table, payment columns, delivery columns, etc. via numbered SQL files (`001_create_tables.sql` → `008_courier_delivery_fulfillment.sql`) |
| Tracking | Records each applied migration in a `migrations` table so it never runs the same file twice |
| Automatic? | **No.** The backend (`app.js`) does NOT run migrations on startup. You must trigger them manually. |
| When to run | Once after `docker compose up` on a fresh volume, and again after adding a new `.sql` migration file |

### Seeds

| Property | Detail |
|---|---|
| Script | `seeds/seed.js` |
| What it seeds | 180 USDA product types, 10 mock users (with PostGIS locations), 30 mock products |
| Depends on | Migrations — `seed.js` explicitly checks that the `migrations` table exists and has ≥ 2 rows before inserting anything. It exits with an error if migrations haven't run. |
| Safe by default | Won't overwrite existing data unless you pass `--force` |
| Required for production? | **No.** Seeds are mock data for development and testing only. Never seed a real production database. |
| When to run | Once after migrations, on a fresh/empty database |

### Why migrations aren't automatic in this project

The backend is stateless — it only calls `testConnection()` at startup, not `migrate()`. This is a deliberate choice: running DDL automatically on every container start is risky in production (e.g., a bad migration would take down the API). Migrations are a **one-time operator action**, not an application concern.

### Data persistence across operations

| Operation | Schema (migrations) | Data (seeds/user data) |
|---|---|---|
| `docker compose restart backend` | ✅ Preserved | ✅ Preserved |
| `docker compose up -d --build` | ✅ Preserved | ✅ Preserved |
| `docker compose down` | ✅ Preserved | ✅ Preserved |
| `docker compose down -v` | ❌ Destroyed | ❌ Destroyed |

---

## Architecture

Three containers are started together:

| Service    | Container image                    | Exposed port | Description                        |
|------------|------------------------------------|--------------|------------------------------------|
| `db`       | `postgis/postgis:16-3.4-alpine`    | `5433` (host)| PostgreSQL 16 with PostGIS support |
| `backend`  | Built from `server/Dockerfile`     | `3001`       | Express/Node.js REST API           |
| `frontend` | Built from `chenda-frontend/Dockerfile` | `3000`  | Next.js app (standalone build)     |

The `db` container must pass its healthcheck before `backend` starts. `frontend` starts after `backend`.

Named Docker volumes keep data and uploads alive across container restarts:
- `postgres_data` — PostgreSQL data directory
- `uploads_data` — user-uploaded product images

---

## Prerequisites

Install these on the target machine:

- **Docker Engine** ≥ 24 — [get-docker](https://docs.docker.com/get-docker/)
- **Docker Compose** v2 (bundled with Docker Desktop, or install the CLI plugin separately)

Verify:
```bash
docker --version        # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

> **Note:** This guide uses `docker compose` (Compose v2 CLI plugin). If you have the older standalone binary, use `docker-compose` instead.

---

## Step 1 — Clone the repository

```bash
git clone <repo-url> chenda
cd chenda
```

---

## Step 2 — Create `.env.docker`

All three containers read their configuration from a single `.env.docker` file in the project root. A ready-to-use template is already committed:

```
chenda/.env.docker
```

**Review and keep (or update) the following values:**

```dotenv
# Port on your host machine that maps to the DB container's 5432.
# Use 5433 to avoid conflicts if a local PostgreSQL is running on 5432.
DB_HOST_PORT=5433

# Password for the postgres superuser inside the container.
DB_PASSWORD=postgres

# Session secret — MUST be at least 32 characters.
# The value below is a safe default for local/dev Docker usage.
SESSION_SECRET=9f2c8a7b5d3e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6

# Browser-facing URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Internal container-to-container URL (do not change for local Docker)
INTERNAL_API_URL=http://backend:3001
```

> **Do not rename this file.** `docker-compose.yml` is already configured to read from `.env.docker`:
> ```yaml
> env_file:
>   - .env.docker
> ```

For a production deployment, generate a stronger session secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Step 3 — Build and start all services

From the project root:

```bash
docker compose up -d --build
```

- `--build` rebuilds the backend and frontend images from source on every run. Omit on subsequent starts if code has not changed.
- `-d` runs containers in detached (background) mode.

The first build takes a few minutes as it downloads base images and installs npm dependencies inside the containers.

---

## Step 4 — Verify the containers are running

```bash
docker compose ps
```

Expected output (all services should show `running`):

```
NAME                      IMAGE                           STATUS
chenda-backend-1          chenda-backend                  Up X seconds
chenda-db-1               postgis/postgis:16-3.4-alpine   Up X seconds (healthy)
chenda-frontend-1         chenda-frontend                 Up X seconds
```

If any service shows `restarting`, check its logs immediately:

```bash
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

---

## Step 5 — Run migrations (required on first start)

Migrations create the entire database schema: all tables, indexes, the session table, payment columns, delivery columns, etc. **The backend does not run migrations automatically on startup** — you must trigger them once after the containers are first brought up.

### Where the migration files live

The `migrations/` directory is in the **project root** — it is not copied into the backend container image (the image only contains `server/`). Migration SQL files are applied directly against the `db` container using `psql`.

### Running migrations

From the project root, pipe each SQL file into the `db` container in order:

```bash
# Run all migrations in order (paste as a single block)
docker compose exec -T db psql -U postgres -d chenda < migrations/001_create_tables.sql
docker compose exec -T db psql -U postgres -d chenda < migrations/002_create_indexes.sql
docker compose exec -T db psql -U postgres -d chenda < migrations/003_create_session_table.sql
docker compose exec -T db psql -U postgres -d chenda < migrations/004_optimize_indexes.sql
docker compose exec -T db psql -U postgres -d chenda < migrations/005_payment_integration.sql
docker compose exec -T db psql -U postgres -d chenda < migrations/006_refunds_reconciliation.sql
docker compose exec -T db psql -U postgres -d chenda < migrations/007_payment_monitoring_alerts.sql
docker compose exec -T db psql -U postgres -d chenda < migrations/008_courier_delivery_fulfillment.sql
```

Or as a one-liner loop:
```bash
for f in migrations/00*.sql; do
  echo "Applying $f..."
  docker compose exec -T db psql -U postgres -d chenda < "$f"
done
```

Verify the schema was applied:
```bash
docker compose exec db psql -U postgres -d chenda -c "\dt"
```

You should see all application tables listed (users, products, product_types, orders, deliveries, session, etc.).

> **Why `-T`?** The `-T` flag disables pseudo-TTY allocation, which is required when piping stdin (`<`) to `docker compose exec`. Without it, the pipe will hang.

> **Re-running is safe.** All migration SQL files use `CREATE TABLE IF NOT EXISTS` and similar idempotent statements — running them again on an existing schema produces no errors and makes no changes.

---

## Step 6 — Seed the database (optional, dev/testing only)

Seeds populate the database with mock data for development and testing. **Do not seed a real production database.**

The `seeds/` directory is also in the project root (not inside the container). The seed SQL files are piped directly into the `db` container, in dependency order:

```bash
# 1. Product types (must be first — products FK to this table)
docker compose exec -T db psql -U postgres -d chenda < seeds/product_types.sql

# 2. Mock users
docker compose exec -T db psql -U postgres -d chenda < seeds/mock_users.sql

# 3. Mock products (requires users and product_types to exist)
docker compose exec -T db psql -U postgres -d chenda < seeds/mock_products.sql

# 4. Nationwide products (large dataset, optional)
docker compose exec -T db psql -U postgres -d chenda < seeds/nationwide_products.sql
```

Alternatively, use the `seed.js` script with a temporary container that has the project root mounted:
```bash
# Run the Node seed script with the full project root available
docker compose run --rm \
  -v "$(pwd)":/workspace \
  -w /workspace/server \
  --entrypoint node \
  backend ../seeds/seed.js
```

> **Note:** The `seed.js` script checks that migrations have been applied before inserting data. If you get a `migrations table not found` error, run Step 5 first.

What gets seeded:
- **180 USDA product types** (real FoodKeeper data — categories, shelf life defaults)
- **10 mock users** with PostGIS location coordinates (5 buyers, 3 sellers, 2 both)
- **30 mock products** linked to mock sellers, with locations and freshness data
- **Nationwide products** (large additional product listing dataset)

Test credentials after seeding:
```
Email:    maria.santos@email.com
Password: password123
(all mock users share the same password)
```

---

## Access the application

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000      |
| Backend API | http://localhost:3001   |
| Database | `localhost:5433` (use any PostgreSQL client, user: `postgres`) |

---

## Day-to-day commands

```bash
# Start services (no rebuild)
docker compose up -d

# Start and rebuild images after code changes
docker compose up -d --build

# Stop services (data is preserved in volumes)
docker compose down

# Stop and delete all data (volumes)
docker compose down -v

# Follow live logs for all services
docker compose logs -f

# Follow logs for a specific service
docker compose logs -f backend

# Open a shell inside a running container
docker compose exec backend sh
docker compose exec db psql -U postgres -d chenda

# Restart a single service
docker compose restart backend
```

---

## Rebuilding after code changes

| Change made | Command |
|---|---|
| Backend source code changed | `docker compose up -d --build backend` |
| Frontend source code changed | `docker compose up -d --build frontend` |
| Both changed | `docker compose up -d --build` |
| `docker-compose.yml` changed | `docker compose up -d` (Compose re-creates affected containers) |

---

## Troubleshooting

### Port already in use

```
Error response from daemon: driver failed programming external connectivity:
  Bind for 0.0.0.0:5433 failed: port is already allocated
```

Another process on your machine is using that port. Either stop it, or change `DB_HOST_PORT` in `.env.docker` to a free port (e.g. `5434`) and restart:
```bash
docker compose down
docker compose up -d
```

### Backend keeps restarting

Check the logs:
```bash
docker compose logs backend
```

Common causes:
- **`SESSION_SECRET` too short** — must be ≥ 32 characters in `.env.docker`.
- **DB not ready** — the `db` healthcheck should prevent this, but if the DB container itself is unhealthy, fix the DB first.
- **Missing env variables** — ensure `.env.docker` exists and has no syntax errors.

### Frontend build fails

The Next.js Dockerfile requires `next.config.ts` to have `output: 'standalone'` set. Verify:
```bash
grep -n standalone chenda-frontend/next.config.ts
```

### Database connection refused

Ensure the `db` container is healthy:
```bash
docker compose ps db
```
If it shows `unhealthy`, inspect:
```bash
docker compose logs db
```

### Data persists after `docker compose down`

This is expected. Named volumes (`postgres_data`, `uploads_data`) survive `down`. To start completely fresh:
```bash
docker compose down -v   # removes volumes
docker compose up -d --build
```

---

## How environment variables flow

```
.env.docker  ──► docker-compose.yml (env_file)
                    ├─► db container   (DB_PASSWORD, DB_HOST_PORT)
                    ├─► backend container (DB_PASSWORD, SESSION_SECRET, FRONTEND_URL, ...)
                    └─► frontend container (NEXT_PUBLIC_API_URL, INTERNAL_API_URL, ...)
```

The containers do **not** read `server/.env` or `chenda-frontend/.env.local`. Those files are for local (non-Docker) development only.

---

## Related documentation

- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) — production deployment considerations
- [ENVIRONMENT_CONFIG_GUIDE.md](../ENVIRONMENT_CONFIG_GUIDE.md) — full reference for all environment variables
- [seeding-guide.md](seeding-guide.md) — more detail on the seed scripts
- [SETUP_GUIDE.md](SETUP_GUIDE.md) — non-Docker local development setup
