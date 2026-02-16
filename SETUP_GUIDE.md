# Chenda Backend Setup Guide

Complete guide for setting up the Chenda backend on Windows and Linux.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Windows Setup](#windows-setup)
3. [Linux Setup](#linux-setup)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Manual Setup Steps](#manual-setup-steps)
6. [Verification](#verification)

---

## Prerequisites

### Required Software

#### 1. **Node.js 18+ and npm**
- **Download**: https://nodejs.org/
- **Verify**: `node --version` and `npm --version`
- **Note**: Node.js 20 LTS recommended

#### 2. **PostgreSQL 15**
- **Windows**: https://www.postgresql.org/download/windows/
- **Linux**: Package manager (apt, dnf, yum)
- **Verify**: `psql --version`
- **Important**: Remember the password you set for the `postgres` user during installation

#### 3. **PostGIS Extension**
- **Windows**: https://download.osgeo.org/postgis/windows/pg15/
- **Linux**: Usually available via package manager
- **Required for**: Geospatial queries and distance calculations

### Optional Tools
- **Git**: For version control
- **curl**: For API testing
- **Postman**: For API development/testing

---

## Windows Setup

### Quick Start (Recommended)

1. **Set Terminal Profile to Bash**
   - Open Windows Terminal
   - Settings → Default Profile → Select "Git Bash" or "WSL Bash"
   - Bash is more reliable for running scripts than PowerShell

2. **Run Setup Script**
   ```bash
   # In the project root directory
   ./setup-backend-windows.bat
   ```

3. **Follow Prompts**
   - Enter PostgreSQL password when prompted
   - Edit `.env` file when opened in Notepad

### Detailed Windows Setup

#### Step 1: Install Prerequisites

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Run installer (default options are fine)
   - Verify: `node --version`

2. **Install PostgreSQL 15**
   - Download from https://www.postgresql.org/download/windows/
   - Run installer
   - **IMPORTANT**: Note the password you set for `postgres` user
   - Default port: 5432 (keep default)
   - Add to PATH when prompted

3. **Install PostGIS** (Critical Step)
   
   **Option A: Automated Script (Recommended)**
   ```bash
   # Download PostGIS bundle first
   # Go to: https://download.osgeo.org/postgis/windows/pg15/
   # Download: postgis-bundle-pg15-3.6.1x64.zip
   # Save to Downloads folder
   
   # Run installation script (as Administrator)
   powershell -ExecutionPolicy Bypass -File install-postgis-simple.ps1
   ```
   
   **Option B: Manual Installation**
   1. Download PostGIS bundle from: https://download.osgeo.org/postgis/windows/pg15/
   2. Extract ZIP file
   3. **Stop PostgreSQL**:
      ```bash
      "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" stop -D "C:\Program Files\PostgreSQL\15\data" -m fast
      ```
   4. Copy files (requires Administrator):
      - Copy `bin\*` → `C:\Program Files\PostgreSQL\15\bin\`
      - Copy `lib\*` → `C:\Program Files\PostgreSQL\15\lib\`
      - Copy `share\*` → `C:\Program Files\PostgreSQL\15\share\`
   5. **Start PostgreSQL**:
      ```bash
      "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\15\data" -w
      ```
   6. Enable extension:
      ```bash
      psql -U postgres -d chenda_db -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"
      ```

#### Step 2: Setup Environment

1. **Copy Environment Template**
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

2. **Edit .env Files**
   ```bash
   notepad .env
   ```
   
   Set `DB_PASSWORD` to your PostgreSQL password:
   ```env
   DB_PASSWORD=your_postgres_password_here
   ```

3. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

#### Step 3: Database Setup

1. **Create Database**
   ```bash
   psql -U postgres -c "CREATE DATABASE chenda_db;"
   ```

2. **Enable PostGIS**
   ```bash
   psql -U postgres -d chenda_db -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"
   ```
   
   **Verify PostGIS**:
   ```bash
   psql -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
   ```
   Expected output: `3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`

3. **Run Migrations**
   ```bash
   node migrations/migrate.js up
   ```
   Expected: 3 migrations applied

4. **Seed Database**
   ```bash
   node seeds/seed.js
   ```
   Expected: 180 product types, 10 users, 30 products

#### Step 4: Start Server

```bash
cd server
npm run dev
```

Expected output:
```
🚀 Server running on http://localhost:3001
✓ Database connected successfully
```

**Verify**:
```bash
curl http://localhost:3001/api/health
```

---

## Linux Setup

### Quick Start (Recommended)

```bash
# Make script executable
chmod +x setup-backend-linux.sh

# Run setup
./setup-backend-linux.sh
```

### Detailed Linux Setup

#### Step 1: Install Prerequisites

**Ubuntu/Debian:**
```bash
# Update package list
sudo apt update

# Install PostgreSQL with PostGIS
sudo apt install postgresql postgresql-contrib postgresql-15-postgis-3

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**
```bash
# Install PostgreSQL
sudo dnf install postgresql-server postgis

# Initialize database
sudo postgresql-setup --initdb

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

#### Step 2: Setup Environment

```bash
# Copy environment templates
cp .env.example .env
cp server/.env.example server/.env

# Edit .env
nano .env
# Set DB_PASSWORD

# Install dependencies
npm install
cd server && npm install && cd ..
```

#### Step 3: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql:
CREATE DATABASE chenda_db;
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;
\q

# Or as one-liner:
sudo -u postgres psql -c "CREATE DATABASE chenda_db;"
sudo -u postgres psql -d chenda_db -c "CREATE EXTENSION postgis CASCADE;"

# Run migrations
node migrations/migrate.js up

# Seed database
node seeds/seed.js
```

#### Step 4: Start Server

```bash
cd server
npm run dev
```

---

## Common Issues & Solutions

### Issue 1: PowerShell Execution Policy Error

**Symptom:**
```
execution of scripts is disabled on this system
```

**Solution:**
```powershell
powershell -ExecutionPolicy Bypass -File script.ps1
```

**Or switch to Bash** (Recommended):
- Windows Terminal → Settings → Default Profile → Git Bash

---

### Issue 2: PostGIS DLL Not Found

**Symptom:**
```
ERROR: could not load library "postgis-3.dll": The specified module could not be found
```

**Cause**: PostGIS not installed or PostgreSQL was running during installation

**Solution**:
1. Stop PostgreSQL completely
2. Install PostGIS (see Windows setup Step 1.3)
3. Restart PostgreSQL
4. Enable extension

**Windows specific**:
```bash
# Stop PostgreSQL
"C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" stop -D "C:\Program Files\PostgreSQL\15\data" -m fast

# Copy PostGIS files (after extraction)
# Requires Administrator privileges

# Start PostgreSQL
"C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\15\data" -w

# Enable extension
psql -U postgres -d chenda_db -c "CREATE EXTENSION postgis CASCADE;"
```

---

### Issue 3: Empty Password Error

**Symptom:**
```
Error: SASL: client password must be a string
```

**Cause**: PostgreSQL requires authentication but password is empty

**Solution**:
Set a password in `.env`:
```env
DB_PASSWORD=your_actual_password
```

Not recommended for production, but for development you can configure trust authentication:
1. Edit `pg_hba.conf` (located in PostgreSQL data directory)
2. Change `scram-sha-256` to `trust` for local connections
3. Restart PostgreSQL

---

### Issue 4: Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux
lsof -ti:3001 | xargs kill -9
```

---

### Issue 5: Database Connection Refused

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Check if PostgreSQL is running
# Windows:
"C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" status -D "C:\Program Files\PostgreSQL\15\data"

# Linux:
sudo systemctl status postgresql

# Start if not running
# Windows:
"C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\15\data" -w

# Linux:
sudo systemctl start postgresql
```

---

## Manual Setup Steps

If automated scripts don't work, follow these manual steps:

### 1. Environment Setup
```bash
cp .env.example .env
# Edit .env and set DB_PASSWORD
```

### 2. Install Dependencies
```bash
npm install
cd server && npm install
```

### 3. Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE chenda_db;"

# Enable PostGIS
psql -U postgres -d chenda_db -c "CREATE EXTENSION postgis CASCADE;"

# Verify
psql -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
```

### 4. Run Migrations
```bash
node migrations/migrate.js up
```

### 5. Seed Data
```bash
node seeds/seed.js
```

### 6. Start Server
```bash
cd server
npm run dev
```

---

## Verification

### Backend Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "server": {
    "environment": "development",
    "port": "3001"
  },
  "database": {
    "connected": true,
    "version": "PostgreSQL 15.x"
  }
}
```

### Test Database Connection
```bash
psql -U postgres -d chenda_db -c "SELECT COUNT(*) FROM products;"
```

Expected: `30` (if seeded)

### Test PostGIS
```bash
psql -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
```

Expected: `3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`

---

## What Worked vs What Didn't (Lessons Learned)

### ✅ What Worked

1. **Using Bash instead of PowerShell on Windows**
   - More reliable for running scripts
   - Better compatibility with Unix-style commands
   - Avoids execution policy issues

2. **Direct `pg_ctl` commands instead of Windows Service**
   - `pg_ctl start/stop` more reliable than `net start postgresql`
   - Service registration sometimes fails on Windows

3. **Setting actual password instead of trust authentication**
   - PostgreSQL's pg library doesn't handle empty passwords well
   - Setting `DB_PASSWORD=postgres` (or any password) resolves SASL errors

4. **Stopping PostgreSQL before installing PostGIS**
   - Critical for file copy operations
   - Prevents "file in use" errors when copying DLLs

5. **.env.example pattern**
   - Keeps sensitive data out of git
   - Makes setup clear for new developers

### ❌ What Didn't Work

1. **Empty database password with trust authentication**
   - Even with `pg_hba.conf` set to trust, Node.js pg library requires string password
   - Solution: Set actual password

2. **Windows Service for PostgreSQL**
   - Service registration via `pg_ctl register` often fails
   - Solution: Use `pg_ctl start/stop` directly

3. **PowerShell execution policy issues**
   - Scripts blocked by default security settings
   - Solution: Use `-ExecutionPolicy Bypass` or switch to Bash

4. **Installing PostGIS while PostgreSQL running**
   - File copy operations fail when DLLs are in use
   - Solution: Stop PostgreSQL first

5. **Stack Builder for PostGIS**
   - Sometimes doesn't detect local PostgreSQL installation
   - Shows "remote server" instead of local instance
   - Solution: Manual ZIP file extraction and copying

---

## Next Steps

After backend is running:

1. **Start Frontend**
   ```bash
   cd chenda-frontend
   npm install
   npm run dev
   ```

2. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

3. **Test the Application**
   - Register a buyer account
   - Login and access `/buyer` dashboard
   - Test search functionality
   - View products with maps
   - Add items to cart

---

## Support

For issues not covered in this guide:
1. Check error logs in `server/logs/`
2. Check PostgreSQL logs in `PostgreSQL\15\data\log\`
3. Verify all environment variables are set correctly
4. Ensure all prerequisites are installed with correct versions

---

## Production Deployment Notes

Before deploying to production:

1. **Environment Variables**
   - Set strong `SESSION_SECRET`
   - Use secure `DB_PASSWORD`
   - Set `NODE_ENV=production`

2. **Database**
   - Use managed PostgreSQL service (AWS RDS, Azure Database, etc.)
   - Enable SSL connections
   - Regular backups

3. **Security**
   - Never commit `.env` to git
   - Use environment-specific secrets management
   - Enable HTTPS
   - Configure CORS properly

4. **Performance**
   - Enable PostgreSQL connection pooling
   - Add database indexes (already in migrations)
   - Use CDN for static assets
   - Enable caching where appropriate
