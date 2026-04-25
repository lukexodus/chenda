# Docker Container Deployment

This guide explains how to set up and run the full Chenda stack (database, backend API, frontend) using Docker and Docker Compose. The entire environment is defined in code, so it works identically on any machine with Docker installed — no local PostgreSQL, Node, or Python installation required.

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

## Step 1 — Clone the repository

```bash
git clone <repo-url> chenda
cd chenda
```

Windows (PowerShell):
```powershell
git clone <repo-url> chenda
Set-Location chenda
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

# Port used by backend -> db inside Docker network.
# Keep this as 5432 (do not set to DB_HOST_PORT).
DB_PORT=5432

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

### Development workflow for teammates (Arch + Windows)

For day-to-day coding, use the dev Compose override with bind mounts:

- Base file: `docker-compose.yml` (DB + default service config)
- Dev override: `docker-compose.dev.yml` (hot reload, bind mounts, dev targets)

Start dev stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Windows (PowerShell):

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

After the first build, code changes are reflected automatically (no image rebuild needed).

Why this works:

- `./server` and `./chenda-frontend` are bind-mounted into containers.
- Backend runs with `nodemon` and frontend runs with `next dev`.
- Dependencies stay isolated in Docker-managed named volumes (`backend_node_modules`, `frontend_node_modules`).

When to rebuild in dev mode:

- `Dockerfile` changed
- `package.json` or `package-lock.json` changed
- New native dependency or build dependency added

Rebuild only one service if needed:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build frontend
```

Stop dev stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Cross-platform notes:

- Arch/Linux: bind mounts are typically fast by default.
- Windows (Docker Desktop): bind mounts can be slower; keep the repo in WSL2 filesystem when possible for better performance.
- If file-change detection is missed on Windows, polling is enabled in dev config for reliability.

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

### Migration runner and tracking

The `migrations/` directory contains:
- `migrate.js` — Migration runner that tracks which migrations have been applied
- `001_create_tables.sql` → `011_product_type_images.sql` — Numbered SQL files

The `migrate.js` runner:
1. Creates a `migrations` table to track applied migrations
2. Runs each SQL file only once (safely skips if already applied)
3. Wraps each migration in a transaction for consistency
4. Prevents partial migrations and schema drift

### Running migrations

From the **project root** (where `migrations/` directory exists):

```bash
# Run all pending migrations
node migrations/migrate.js up

# Check migration status
node migrations/migrate.js status
```

Windows (PowerShell):
```powershell
# Run all pending migrations
node migrations/migrate.js up

# Check migration status
node migrations/migrate.js status
```

This will automatically:
- Detect your database configuration from `.env.docker`
- Create the `migrations` tracking table if it doesn't exist
- Apply each pending migration in order
- Skip any migrations already recorded in the tracking table
- Show a summary of applied vs available migrations

The runner connects to the database specified in `.env.docker`:
- `DB_HOST=db` (Docker service hostname)
- `DB_PORT=5432` (internal container port)
- `DB_NAME=chenda`

#### Recent migrations

| Migration | Date | What it adds |
|---|---|---|
| `009_hybrid_product_types.sql` | 2026-04-24 | `source`/`region` columns, `product_shelf_life_overrides` table |
| `010_custom_product_types.sql` | 2026-04-25 | `source='custom'` support, community avg trigger, dedup index, custom ID sequence |
| `011_product_type_images.sql` | 2026-04-25 | `image_url TEXT` on `product_types` |

Verify the schema was applied:
```bash
docker compose exec db psql -U postgres -d chenda -c "\dt"
```

You should see all application tables listed including:
- users, products, product_types, product_shelf_life_overrides (new), orders, deliveries, session, etc.

Check specifically for the new columns:
```bash
docker compose exec db psql -U postgres -d chenda -c "
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'product_types' 
  ORDER BY ordinal_position;
"
```

Should show: id, name, name_subtitle, category_id, keywords, default_shelf_life_days, default_storage_condition, shelf_life_source, **source**, **region**, **is_available_in_philippines**, created_at, updated_at

### Why this approach is safer

- **Idempotent**: Each migration is tracked, so running `migrate.js` multiple times is safe — it only applies pending migrations.
- **Transactional**: If a migration fails halfway, the transaction rolls back and the schema remains consistent.
- **Auditable**: The `migrations` table records exactly which migrations have been applied and when.
- **No partial state**: Manual SQL piping can leave the schema in an inconsistent state if a command fails; the migration runner prevents this.

### Already-migrated databases

If you previously applied migrations manually (with `docker compose exec -T db psql ...`), the `migrations` table won't have records, but the schema will exist. On the next run, `migrate.js` will:
- See the tables exist (via `CREATE TABLE IF NOT EXISTS`)
- Skip creating them again without error
- Still insert the migration records into the `migrations` table for future tracking

This is safe — subsequent runs will never try to recreate what already exists.

**To bootstrap tracking for an already-migrated Docker database:**

```bash
# From the project root (where migrations/ exists)
node migrations/migrate.js up
```

This single command will establish the tracking table and record all applied migrations, even if they were previously applied manually. Verify with:

```bash
node migrations/migrate.js status
```

See [migrations/README.md](../../migrations/README.md#handling-already-migrated-databases) for more details.

---

## Step 6 — Seed the database (optional, dev/testing only)

Seeds populate the database with mock data for development and testing. **Do not seed a real production database.**

**What gets seeded:**
- **~180 USDA product types** (baseline universal items)
- **23 Philippine regional product types** (local specialties)
- **10 mock users** with PostGIS locations
- **30–200+ mock products** depending on seed file
- **Product type images** — populated automatically from `seeds/product-images-manifest.json` if it exists (only required if assets are missing from repo)

### First-time setup (fresh database)

Choose one approach:

#### Approach A: Full workflow with images (recommended)

```bash
# 1. Download product images (Skip if already in repo)
# Only required if seeds/product-images-manifest.json is missing
node seeds/fetch-product-images.js --download --all

# 2. Seed — images applied automatically
node seeds/seed.js
```

#### Approach B: SQL pipeline (minimal)
```bash
# 1. USDA product types (must be first)
docker compose exec -T db psql -U postgres -d chenda < seeds/product_types.sql

# 2. Philippine regional product types (NEW — Migration 009)
docker compose exec -T db psql -U postgres -d chenda < seeds/philippines_regional_products.sql

# 3. Mock users
docker compose exec -T db psql -U postgres -d chenda < seeds/mock_users.sql

# 4. Mock products
docker compose exec -T db psql -U postgres -d chenda < seeds/mock_products.sql

# 5. Nationwide products (optional, large dataset)
docker compose exec -T db psql -U postgres -d chenda < seeds/nationwide_products.sql
```

#### Approach C: Seeder CLI (all-in-one)

```bash
# From project root, seeds automatically included
node seeds/seed.js
```

Or in a temporary backend container:

```bash
docker compose run --rm backend node seeds/seed.js
```

### Already seeded database? (Migrating to Migration 009)

If you have an existing seeded database from before Migration 009, **choose one path:**

#### Path 1: Minimal update (keep existing data)

```bash
# Add new regional products without disturbing existing data
docker compose exec -T db psql -U postgres -d chenda < seeds/philippines_regional_products.sql
```

Pros: No data loss, new types available immediately  
Cons: Existing shelf life override features unused on old products

#### Path 2: Full reset (clean slate)

```bash
# Clear everything and reseed with all new data
node seeds/seed.js --force
```

Pros: Clean start, all features active  
Cons: All existing products/orders/users deleted

#### Path 3: Keep users, refresh products

```bash
# Refresh products while keeping test users
node seeds/seed.js --products-only
```

**See [SEEDING_GUIDE.md](SEEDING_GUIDE.md) for detailed migration paths and validation commands.**

### Verification

After seeding, check product type counts:

```bash
docker compose exec db psql -U postgres -d chenda -c "
  SELECT source, COUNT(*) FROM product_types GROUP BY source;
"

# Expected (after full seed + image fetch):
#  source   | count
# ----------+-------
#  regional  |    23
#  usda      |   180
# (custom rows appear as sellers create products)

# Image population
docker compose exec db psql -U postgres -d chenda -c "
  SELECT COUNT(*) FILTER (WHERE image_url IS NOT NULL) AS types_with_images,
         COUNT(*) AS total
  FROM product_types;
"
```

Test credentials:
```
Email:    maria.santos@email.com
Password: password123
```

### Available CLI modes

| Mode | Command | Use case |
|---|---|---|
| Safe default | `node seeds/seed.js` | First seed on empty DB |
| Full reset | `node seeds/seed.js --force` | Clear all, reseed everything |
| Products only | `node seeds/seed.js --products-only` | Refresh listings, keep users/types |

### Apply image manifest to Docker DB (existing seeded database)

If you already ran `fetch-product-images.js` and want those results reflected in the **Docker** database state, run seeding from the backend container:

```bash
docker compose exec backend node seeds/seed.js --products-only
```

Why this is required:
- `fetch-product-images.js` only writes files + `seeds/product-images-manifest.json`
- DB updates happen when `seed.js` runs `applyImageManifest()`
- Running `seed.js` on host can target local Postgres (`localhost`) instead of Docker `db`

### Image file path alignment in Docker

`fetch-product-images.js` currently writes to `public/images/products/...` at repo root. In Docker setups, make sure your served static path includes those files; otherwise DB `image_url` values can exist but return `404` in UI.

Choose one:

1. Copy/move generated files to `chenda-frontend/public/images/products`
2. Update `fetch-product-images.js` `outputDir` to `chenda-frontend/public/images/products` and regenerate
3. Add compose/static serving config so root `public/images/products` is served

### Quick verification after Docker manifest apply

```bash
# DB verification
docker compose exec db psql -U postgres -d chenda -c "
  SELECT COUNT(*)
  FROM product_types
  WHERE image_url IS NOT NULL AND image_url <> '';
"

# Asset verification (replace with a real file)
curl -I http://localhost:3000/images/products/<slug>.jpg
```

Expected:
- SQL count > 0
- HTTP status `200` for valid image files

See [SEEDING_GUIDE.md](SEEDING_GUIDE.md) for full details.

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
| What it does | Creates all tables, indexes, the session table, payment columns, delivery columns, extensible product type system, and product image support via numbered SQL files (`001_create_tables.sql` → `011_product_type_images.sql`) |
| Tracking | Records each applied migration in a `migrations` table so it never runs the same file twice |
| Automatic? | **No.** The backend (`app.js`) does NOT run migrations on startup. You must trigger them manually. |
| When to run | Once after `docker compose up` on a fresh volume, and again after adding a new `.sql` migration file |

### Seeds

| Property | Detail |
|---|---|
| Script | `seeds/seed.js` |
| What it seeds | ~180 USDA product types, 23 Philippine regional product types, 10 mock users (with PostGIS locations), 30+ mock products; also populates `product_types.image_url` from manifest if available |
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

## Docker Desktop and Image Distribution FAQ

### Do Docker Desktop users need separate instructions?

Usually no. Docker Desktop still uses the same Docker Engine and Compose commands, so this guide works for Docker Desktop users as-is.

### Do Docker Desktop users still need the terminal?

For this project, yes for most setup tasks.

- Docker Desktop UI is great for viewing container status, logs, resource usage, and starting/stopping/restarting containers.
- Initial setup steps here (running ordered migrations, seeding, and one-off compose run commands) are terminal-first operations.
- On Windows, use PowerShell equivalents included in this guide.

### Is cloning/pulling the repo enough to run the app?

For local development and internal testing, yes.

Use this flow:
1. Pull latest source.
2. Run `docker compose up -d --build`.
3. Run migrations (required on fresh volume).
4. Run seeds if needed (optional).

You do not need a container registry for this local workflow because images are built from source on each machine.

### When should we push images to a registry?

Push images to a registry (Docker Hub, GHCR, ECR, etc.) when you need consistent, prebuilt deployment artifacts.

Common cases:
- Production/staging deployments on servers that should pull immutable image tags.
- CI/CD pipelines that build once and deploy the same image everywhere.
- Faster onboarding where users should run without local image builds.
- Environments where source code is not copied to the runtime host.

Rule of thumb:
- Local dev: repo pull + local build is enough.
- Shared/prod deployment: publish versioned images to a registry.

---

## How environment variables flow

```
.env.docker  ──► docker-compose.yml (env_file)
                    ├─► db container   (DB_PASSWORD, DB_HOST_PORT)
                    ├─► backend container (DB_PORT=5432, DB_PASSWORD, SESSION_SECRET, FRONTEND_URL, ...)
                    └─► frontend container (NEXT_PUBLIC_API_URL, INTERNAL_API_URL, ...)
```

The containers do **not** read `server/.env` or `chenda-frontend/.env.local`. Those files are for local (non-Docker) development only.

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

Windows (PowerShell) equivalent:
```powershell
Select-String -Path chenda-frontend/next.config.ts -Pattern standalone
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

### Static assets (logo, favicon, etc.) not loading in dev mode

If images or icons in `chenda-frontend/public/` are returning 404 in dev mode, ensure the public volume mount is present in `docker-compose.dev.yml`:

```yaml
frontend:
  volumes:
    - ./chenda-frontend:/app
    - ./chenda-frontend/public:/app/public  # ← This line is required
    - frontend_node_modules:/app/node_modules
    - frontend_next:/app/.next
```

After adding the mount, restart the dev stack:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

The `public/` directory is served by Next.js at the root path (`/`). Files like `chenda-frontend/public/chenda.png` are accessible as `http://localhost:3000/chenda.png`.

### Data persists after `docker compose down`

This is expected. Named volumes (`postgres_data`, `uploads_data`) survive `down`. To start completely fresh:
```bash
docker compose down -v   # removes volumes
docker compose up -d --build
```

---

## Related documentation

- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) — production deployment considerations
- [ENVIRONMENT_CONFIG_GUIDE.md](../ENVIRONMENT_CONFIG_GUIDE.md) — full reference for all environment variables
- [seeding-guide.md](seeding-guide.md) — more detail on the seed scripts
- [SETUP_GUIDE.md](SETUP_GUIDE.md) — non-Docker local development setup
