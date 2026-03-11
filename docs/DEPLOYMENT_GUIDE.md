# Chenda — Deployment Guide

> Instructions for running Chenda locally on a single machine, and for deploying to a Linux VPS.

---

## Table of Contents

1. [Local Deployment (Windows)](#local-deployment-windows)
2. [Local Deployment (Linux / macOS)](#local-deployment-linux--macos)
3. [Environment Configuration Reference](#environment-configuration-reference)
4. [Database Migrations and Seeding](#database-migrations-and-seeding)
5. [Cloud Deployment (Linux VPS)](#cloud-deployment-linux-vps)
6. [Resetting the Database](#resetting-the-database)

---

## Local Deployment (Windows)

### Prerequisites

- Node.js 20+ — <https://nodejs.org/>
- PostgreSQL 15+ with PostGIS — see [DEVELOPER_GUIDE.md §Prerequisites](DEVELOPER_GUIDE.md#prerequisites)
- Git for Windows (includes Git Bash) — <https://git-scm.com/>

All commands below run in **Git Bash** unless noted.

### Step 1 — Clone and install

```bash
git clone <repository-url> chenda
cd chenda

npm install
cd server && npm install && cd ..
cd chenda-frontend && npm install && cd ..
```

### Step 2 — Configure environment

```bash
cp server/.env.example server/.env
```

Open `server\.env` in any editor and set:

```env
DB_PASSWORD=your_postgres_password
SESSION_SECRET=any-long-random-string
```

All other defaults work for a local setup. Create the frontend environment file:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > chenda-frontend/.env.local
```

### Step 3 — Create the database

Open **psql** (or pgAdmin) as the `postgres` user:

```sql
CREATE DATABASE chenda_db;
\c chenda_db
CREATE EXTENSION postgis;
\q
```

### Step 4 — Run migrations and seed

```bash
node migrations/migrate.js up
node seeds/seed.js
```

### Step 5 — Start both servers

**Terminal 1 (backend):**

```bash
cd server && npm run dev
```

**Terminal 2 (frontend):**

```bash
cd chenda-frontend && npm run dev
```

Open <http://localhost:3000> in your browser. Log in with `maria@test.com` / `password123` to verify.

---

## Local Deployment (Linux / macOS)

### Step 1 — Install system dependencies

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib postgis postgresql-15-postgis-3 git
sudo systemctl enable --now postgresql
```

**macOS (Homebrew):**

```bash
brew install node postgresql@15 postgis git
brew services start postgresql@15
```

Verify Node.js version:

```bash
node --version   # should be 20.x or higher
```

If the system Node is older, use [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Step 2 — Clone and install

```bash
git clone <repository-url> chenda
cd chenda
npm install
cd server && npm install && cd ..
cd chenda-frontend && npm install && cd ..
```

### Step 3 — Configure environment

```bash
cp server/.env.example server/.env
nano server/.env   # or use any editor
```

Set `DB_PASSWORD` and `SESSION_SECRET`.

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > chenda-frontend/.env.local
```

### Step 4 — Create the database

```bash
sudo -u postgres psql <<EOF
CREATE DATABASE chenda_db;
\c chenda_db
CREATE EXTENSION postgis;
EOF
```

### Step 5 — Run migrations and seed

```bash
node migrations/migrate.js up
node seeds/seed.js
```

### Step 6 — Start both servers

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd chenda-frontend && npm run dev
```

---

## Environment Configuration Reference

### `server/.env`

| Variable | Local Value | Production Notes |
|----------|-------------|-----------------|
| `DB_HOST` | `localhost` | Set to DB host or 127.0.0.1 |
| `DB_PORT` | `5432` | Default PostgreSQL port |
| `DB_NAME` | `chenda_db` | Create before running migrations |
| `DB_USER` | `postgres` | Use a dedicated database user in production |
| `DB_PASSWORD` | _(your password)_ | **Required.** Use a strong password in production |
| `PORT` | `3001` | The port the API server listens on |
| `NODE_ENV` | `development` | Set to `production` in production |
| `SESSION_SECRET` | _(any string)_ | **Required.** Use a long random string in production |
| `FRONTEND_URL` | `http://localhost:3000` | Set to your domain in production (e.g. `https://yourdomain.com`) |
| `UPLOAD_DIR` | `./uploads` | Directory for uploaded images; must be writable |
| `MAX_FILE_SIZE` | `5242880` | 5 MB in bytes |

### `chenda-frontend/.env.local`

| Variable | Local Value | Production Notes |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Set to your API domain (e.g. `https://api.yourdomain.com`) |

---

## Database Migrations and Seeding

### Migration commands

```bash
node migrations/migrate.js up         # Apply all pending migrations
node migrations/migrate.js status     # Show migration status
node migrations/migrate.js rollback   # Roll back the last migration
```

Migrations are idempotent by file name — already-applied migrations are skipped.

### Seed commands

```bash
node seeds/seed.js              # Safe seed (skips if data exists)
node seeds/seed.js --force      # Truncate all tables, then re-seed
```

The seed inserts:
- 180 USDA product type entries
- 10 test users (buyer, seller, and both roles) — all passwords `password123`
- 30 test products with varied locations and freshness states

---

## Cloud Deployment (Linux VPS)

This section covers deploying Chenda to a single Ubuntu 22.04 VPS (e.g. DigitalOcean, Linode, AWS EC2).

### 1. Provision the server

The minimum recommended spec:
- 1 vCPU, 2 GB RAM, 25 GB SSD
- Ubuntu 22.04 LTS

### 2. Install dependencies on the VPS

```bash
# Connect to VPS
ssh root@<your-server-ip>

# System packages
apt update && apt upgrade -y
apt install -y git curl nginx postgresql postgresql-contrib postgis postgresql-15-postgis-3 ufw

# Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PM2 (process manager)
npm install -g pm2
```

### 3. Configure the firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### 4. Set up PostgreSQL

```bash
sudo -u postgres psql <<EOF
CREATE ROLE chenda_user WITH LOGIN PASSWORD 'strong_db_password';
CREATE DATABASE chenda_db OWNER chenda_user;
\c chenda_db
CREATE EXTENSION postgis;
EOF
```

### 5. Deploy the application

```bash
# Clone to /var/www
cd /var/www
git clone <repository-url> chenda
cd chenda

npm install
cd server && npm install && cd ..
cd chenda-frontend && npm install && cd ..
```

### 6. Configure production environment

```bash
cp server/.env.example server/.env
nano server/.env
```

Set production values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chenda_db
DB_USER=chenda_user
DB_PASSWORD=strong_db_password
PORT=3001
NODE_ENV=production
SESSION_SECRET=very-long-random-production-secret-change-this
FRONTEND_URL=https://yourdomain.com
```

```bash
cat > chenda-frontend/.env.local <<EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
EOF
```

### 7. Run migrations and seed

```bash
cd /var/www/chenda
node migrations/migrate.js up
node seeds/seed.js
```

### 8. Build the frontend

```bash
cd chenda-frontend
npm run build
```

### 9. Start services with PM2

```bash
cd /var/www/chenda

# Start backend
pm2 start server/app.js --name chenda-api

# Start frontend (Next.js production server)
pm2 start "npm start" --name chenda-frontend --cwd chenda-frontend

# Save PM2 config so it restarts on reboot
pm2 save
pm2 startup   # follow the printed instructions to enable auto-start
```

Check service status:

```bash
pm2 status
pm2 logs chenda-api         # view backend logs
pm2 logs chenda-frontend    # view frontend logs
```

### 10. Configure Nginx as a reverse proxy

Create the Nginx config:

```bash
nano /etc/nginx/sites-available/chenda
```

Paste:

```nginx
# Frontend — youromain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded images directly
    location /uploads/ {
        alias /var/www/chenda/uploads/;
    }
}

# Backend API — api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and test:

```bash
ln -s /etc/nginx/sites-available/chenda /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 11. Enable HTTPS with Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Follow the prompts. Certbot will automatically edit your Nginx config and set up auto-renewal.

### Updating a deployment

```bash
cd /var/www/chenda
git pull

cd server && npm install && cd ..
cd chenda-frontend && npm install && npm run build && cd ..

node migrations/migrate.js up   # apply any new migrations

pm2 restart all
```

---

## Resetting the Database

**Development — wipe and re-seed:**

```bash
node seeds/seed.js --force
```

**Full schema reset (drops and recreates all tables):**

```bash
node migrations/migrate.js rollback   # repeat until "No migrations to roll back"
node migrations/migrate.js up
node seeds/seed.js
```

**Manual drop (PostgreSQL):**

```sql
-- Drops and recreates the database entirely
DROP DATABASE chenda_db;
CREATE DATABASE chenda_db;
\c chenda_db
CREATE EXTENSION postgis;
```

Then run migrations and seed again from the repo root.
