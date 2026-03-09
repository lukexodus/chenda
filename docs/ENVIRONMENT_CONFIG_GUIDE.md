# Environment & Configuration Guide

This document lists every environment variable used by the backend server and the Next.js frontend, explains what each one does, and indicates whether it is **required** or **optional** (with its default value when optional).

---

## Table of Contents

1. [Server (`server/.env`)](#server-serverenv)
   - [Server / Runtime](#server--runtime)
   - [Database](#database)
   - [Session](#session)
   - [CORS](#cors)
   - [Rate Limiting](#rate-limiting)
   - [File Uploads](#file-uploads)
2. [Frontend (`chenda-frontend/.env.local`)](#frontend-chenda-frontendenvlocal)
   - [API](#api)
   - [App Metadata](#app-metadata)
   - [Map Defaults](#map-defaults)
   - [Algorithm Defaults](#algorithm-defaults)
3. [Docker (`/.env` / `.env.docker`)](#docker-env--envdocker)
4. [Test Overrides (`server/.env.test`)](#test-overrides-serverenvtest)
5. [Quick-Reference Tables](#quick-reference-tables)

---

## Server (`server/.env`)

The server loads variables with `dotenv` at startup (`require('dotenv').config()`).  
Copy `server/.env.example` to `server/.env` and fill in the values marked **Required**.

### Server / Runtime

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `NODE_ENV` | `development` | Optional | Runtime environment. Accepted values: `development`, `production`, `test`. Controls debug logging, stack-trace exposure in error responses, and whether the session cookie is marked `Secure`. |
| `PORT` | `3001` | Optional | TCP port the Express server listens on. Change if 3001 is already in use on your machine. |

### Database

All five variables below are consumed by `server/config/database.js` to build the `pg.Pool` connection.

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `DB_HOST` | `localhost` | Optional | Hostname or IP of the PostgreSQL server. In Docker Compose this is automatically set to `db` (the service name). |
| `DB_PORT` | `5432` | Optional | PostgreSQL port. Only change if your Postgres instance runs on a non-standard port. |
| `DB_NAME` | `chenda` | Optional | Name of the database to connect to. The database must already exist (or be created by migrations). |
| `DB_USER` | `postgres` | Optional | PostgreSQL role used to authenticate. |
| `DB_PASSWORD` | *(empty)* | **Required** | Password for `DB_USER`. There is no safe default — always set this in every environment, including local development. |

### Session

Sessions are stored in the `session` PostgreSQL table via `connect-pg-simple`.

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `SESSION_SECRET` | `chenda-secret-key-change-this-in-production` | **Required** | Secret used to sign the session cookie (`chenda.sid`). Must be a long, random, unpredictable string in staging and production. Rotating this value immediately invalidates all active sessions. |
| `SESSION_MAX_AGE` | `86400000` | Optional | How long a session lives, in **milliseconds**. Default is 86 400 000 ms = 24 hours. In production you may want a shorter value (e.g. `3600000` for 1 hour). |

### CORS

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `FRONTEND_URL` | `http://localhost:3000` | Optional (Required in production) | The exact origin the browser sends requests from. Express CORS middleware only allows this origin and sets `credentials: true`. Must match the protocol, hostname, and port of the deployed frontend (e.g. `https://chenda.example.com`). |

### Rate Limiting

Two separate limiters are configured — one for the general API and one stricter limiter for authentication routes (login / register) to slow brute-force attempts.

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Optional | Duration of the general rate-limit sliding window in **milliseconds**. Default = 15 minutes. |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Optional | Maximum number of requests allowed per IP within the general window. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` | Optional | Duration of the auth-specific rate-limit window in milliseconds. Default = 15 minutes. |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | `20` | Optional | Maximum number of authentication attempts (login / register) allowed per IP per window. |

### File Uploads

These variables are primarily used in the test environment (`.env.test`) and by the upload middleware. The production defaults are hard-coded in `server/config/index.js`.

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `UPLOAD_DIR` | `./uploads` | Optional | Directory where product image uploads are stored, relative to the server root. The path must be writable by the Node process. In Docker, this is mounted as a named volume (`uploads_data`). |
| `MAX_FILE_SIZE` | `5242880` | Optional | Maximum allowed upload size in **bytes**. Default = 5 242 880 bytes = 5 MB. |

---

## Frontend (`chenda-frontend/.env.local`)

Next.js loads `.env.local` automatically. Variables prefixed with `NEXT_PUBLIC_` are embedded into the browser bundle at build time and are visible to end users — never store secrets in them.

Copy `chenda-frontend/.env.example` to `chenda-frontend/.env.local` and adjust values as needed.

### API

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | **Required** | Base URL of the backend. All API calls are constructed as `${NEXT_PUBLIC_API_URL}${NEXT_PUBLIC_API_PREFIX}/...`. In Docker Compose, set to `http://localhost:3001` (or your backend's public URL in production). Must **not** have a trailing slash. |
| `NEXT_PUBLIC_API_PREFIX` | `/api` | **Required** | Path prefix for all API routes. Matches the Express router mount point in `app.js`. Change only if you remount the API under a different prefix. |

### App Metadata

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `Chenda` | Optional | Display name of the application. Used in page titles and branding. |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `Fresh Market - Proximity & Freshness Marketplace` | Optional | Short tagline shown in meta tags and landing copy. |

### Map Defaults

The map uses Leaflet with OpenStreetMap tiles. These values set the initial view when the user has not yet granted geolocation permission.

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `NEXT_PUBLIC_MAP_DEFAULT_LAT` | `14.5995` | Optional | Default map center latitude. The default is Manila, Philippines. |
| `NEXT_PUBLIC_MAP_DEFAULT_LNG` | `120.9842` | Optional | Default map center longitude. The default is Manila, Philippines. |
| `NEXT_PUBLIC_MAP_DEFAULT_ZOOM` | `13` | Optional | Default Leaflet zoom level (1 = world, 18 = street level). 13 gives a city-district view. |

### Algorithm Defaults

These control the initial values of the proximity/freshness weighting sliders on the buyer search page. They are sent to the search algorithm in the request body.

| Variable | Default | Required? | Description |
|----------|---------|-----------|-------------|
| `NEXT_PUBLIC_DEFAULT_PROXIMITY_WEIGHT` | `40` | Optional | Initial weight given to proximity when ranking results (0–100). The frontend divides this by 100 before sending to the backend so the algorithm receives a 0–1 float. |
| `NEXT_PUBLIC_DEFAULT_FRESHNESS_WEIGHT` | `60` | Optional | Initial weight given to product freshness (0–100). Sent as a 0–1 float to the backend. Proximity + freshness weights should sum to 100. |
| `NEXT_PUBLIC_DEFAULT_MAX_RADIUS` | `10` | Optional | Default search radius in **kilometres**. Products outside this radius are filtered out (unless the backend falls back to a radius-less search). |
| `NEXT_PUBLIC_DEFAULT_MIN_FRESHNESS` | `20` | Optional | Minimum freshness score (0–100) a product must have to appear in results. |

---

## Docker (`/.env` / `.env.docker`)

When running the full stack via `docker compose up`, Docker Compose reads the root `.env` (or the file specified with `--env-file`). The `.env.docker` file in the repository is a template — copy it to `.env` and fill in the secrets before starting containers.

```
# Copy to .env before running: docker compose up --build
DB_PASSWORD=changeme
SESSION_SECRET=change-this-to-a-long-random-string
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

| Variable | Used By | Required? | Notes |
|----------|---------|-----------|-------|
| `DB_PASSWORD` | `db` service, `backend` service | **Required** | Injected as `POSTGRES_PASSWORD` into the Postgres container and as `DB_PASSWORD` into the backend. |
| `SESSION_SECRET` | `backend` service | **Required** | Passed directly to the Express session middleware. |
| `FRONTEND_URL` | `backend` service | Optional | Defaults to `http://localhost:3000`. Set to your public frontend URL in production. |
| `NEXT_PUBLIC_API_URL` | `frontend` service | Optional | Defaults to `http://localhost:3001`. Must be the publicly reachable backend URL so browser requests work. |

> **Note:** In Docker Compose the remaining server variables (`NODE_ENV`, `PORT`, `DB_HOST`, etc.) are hard-coded directly in `docker-compose.yml` and do not need to be supplied in `.env`.

---

## Test Overrides (`server/.env.test`)

The test suite (`NODE_ENV=test`) loads `server/.env.test` instead of `server/.env`. This keeps test data isolated from your development database.

| Variable | Test Value | Notes |
|----------|-----------|-------|
| `NODE_ENV` | `test` | Enables test-mode behaviour across the app. |
| `PORT` | `3002` | Runs the test server on a separate port to avoid clashing with the dev server. |
| `DB_NAME` | `chenda_test` | Separate database so tests can truncate tables freely. |
| `DB_PASSWORD` | `postgres` | Convenience default for local CI. Change if your Postgres role requires a different password. |
| `SESSION_SECRET` | `test-secret-key-for-testing-only` | Non-secret value safe to commit for reproducible test runs. |
| `RATE_LIMIT_MAX_REQUESTS` | `1000` | Raised limit prevents rate-limiter from interfering with rapid test requests. |
| `UPLOAD_DIR` | `./uploads_test` | Separate upload directory; can be wiped between test runs without affecting development uploads. |
| `MAX_FILE_SIZE` | `5242880` | 5 MB — same as production default. |

---

## Quick-Reference Tables

### Server — Required in Production

| Variable | Example Value |
|----------|--------------|
| `DB_PASSWORD` | `s3curePa$$word` |
| `SESSION_SECRET` | `a-64-char-random-hex-string` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://chenda.example.com` |

### Frontend — Required

| Variable | Example Value |
|----------|--------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` |
| `NEXT_PUBLIC_API_PREFIX` | `/api` |

### Generating a Secure `SESSION_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or with OpenSSL:

```bash
openssl rand -hex 64
```
