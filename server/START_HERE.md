# 🚨 POSTGRESQL SETUP REQUIRED

The backend server requires PostgreSQL 15+ with PostGIS extension.

---

## 🔧 Quick Install (Windows)

### Option 1: Windows Package Manager (Recommended)

Open **PowerShell** (no admin needed):
```powershell
winget install PostgreSQL.PostgreSQL
```

After installation:
1. Open **Stack Builder** from Start Menu
2. Select your PostgreSQL installation  
3. Navigate: **Spatial Extensions → PostGIS**
4. Install PostGIS

### Option 2: Official Installer

1. Download: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Run installer (PostgreSQL 15.x for Windows)
3. Complete installation wizard
4. **Important**: Use Stack Builder to install PostGIS extension

### Option 3: Chocolatey

```powershell
# Run as Administrator
choco install postgresql15 postgis
```

---

## 📖 Detailed Instructions

For complete installation guide including troubleshooting:
**See: [INSTALL_POSTGRESQL_WINDOWS.md](INSTALL_POSTGRESQL_WINDOWS.md)**

---

## ⚡ Quick Start (After PostgreSQL Installed)

### 1. Start PostgreSQL Service

**Via Services GUI:**
- Press `Win + R` → type `services.msc`
- Find `postgresql-x64-15`
- Right-click → Start

**Via Command (Run as Admin):**
```cmd
net start postgresql-x64-15
```

### 2. Create Database

```powershell
# Using psql (add to PATH or use full path)
psql -U postgres -c "CREATE DATABASE chenda_db;"
psql -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"

# Or with full path if psql not in PATH:
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE chenda_db;"
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"
```

**Default password**: What you set during installation (default user: `postgres`)

### 3. Configure Chenda

Edit `server/.env` file:
```env
DB_PASSWORD=your_actual_password_here
```

### 4. Run Setup Script

**From `server` directory:**

```cmd
start.bat
```

**This will automatically:**
- ✅ Check PostgreSQL installation
- ✅ Test database connection
- ✅ Run migrations
- ✅ Seed test data
- ✅ Start the backend server

---

## ✅ Expected Output

```
[+] PostgreSQL service found
[+] Created .env file with default settings
[+] Database connection successful!
[+] Migrations completed!
[+] Database seeding completed!

================================================================
    Starting Backend Server
================================================================

Server will run at: http://localhost:3001
✓ Database connected successfully
Server running on http://localhost:3001
```

---

## 🔍 Verification

Test the backend:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-16T..."
}
```

---

## Troubleshooting

### "PostgreSQL Not Installed"
Download and install from: https://www.postgresql.org/download/windows/

**Important:** During installation:
- ✅ Install PostgreSQL 15 or higher
- ✅ Install Stack Builder → PostGIS extension
- ✅ Remember the postgres user password!

### "Password Authentication Failed"
Update the `DB_PASSWORD` in `server/.env` file to match your PostgreSQL password.

### "Database chenda_db does not exist"
Run this command:
```cmd
psql -U postgres -c "CREATE DATABASE chenda_db;"
psql -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"
```

### "psql command not found"
Add PostgreSQL to your PATH:
1. Find PostgreSQL bin directory (usually `C:\Program Files\PostgreSQL\15\bin`)
2. Add to System PATH environment variable
3. Restart terminal

---

## Next Steps After Backend Starts

1. ✅ Backend running at `http://localhost:3001`
2. Test health endpoint: `curl http://localhost:3001/api/health`
3. Start frontend: `cd ../chenda-frontend && npm run dev`
4. Open browser: `http://localhost:3000`

---

## Current Status

✅ .env file created with default configuration  
❌ PostgreSQL service not running  
⏸️ Database connection failed  
⏸️ Migrations pending  
⏸️ Server not started

**Action Required:** Start PostgreSQL service (see options above)
