# PostgreSQL Installation Guide for Windows

## Requirements
- **PostgreSQL 15 or higher** with **PostGIS extension**
- Required for geospatial features (location-based search)

---

## Installation Options for Windows

### Option 1: Windows Package Manager (winget) - RECOMMENDED

**Prerequisites**: Windows 10 1809+ or Windows 11

```powershell
# Open PowerShell (doesn't need Admin)
winget install PostgreSQL.PostgreSQL
```

**After installation:**
1. PostgreSQL will be installed to `C:\Program Files\PostgreSQL\15\`
2. Service will auto-start as `postgresql-x64-15`
3. Default password set during installation

**Install PostGIS:**
- During PostgreSQL installation, use **Stack Builder** (automatically opens)
- Select: **Spatial Extensions → PostGIS**
- Or download later from: https://postgis.net/install/

---

### Option 2: Chocolatey Package Manager

**Prerequisites**: Chocolatey installed (https://chocolatey.org/install)

```powershell
# Run PowerShell as Administrator
choco install postgresql15 --params '/Password:postgres /Port:5432'

# Install PostGIS
choco install postgis
```

---

### Option 3: Official Installer (Manual)

1. **Download** from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Select: **PostgreSQL 15.x** for Windows x86-64
   
2. **Run Installer** (postgresql-15.x-windows-x64.exe)
   - ✅ Install PostgreSQL Server
   - ✅ Install pgAdmin 4
   - ✅ Install Command Line Tools
   - ✅ Install Stack Builder ← **IMPORTANT for PostGIS**
   
3. **Set Password**:
   - Default user: `postgres`
   - Password: Choose a secure password (you'll need this!)
   
4. **Port**: Use default `5432`

5. **Stack Builder** (opens after installation):
   - Select your PostgreSQL installation
   - Navigate: **Spatial Extensions → PostGIS**
   - Install PostGIS Bundle

---

## Quick Installation Script (PowerShell)

Save as `install-postgresql.ps1` and run:

```powershell
# Check if winget is available
if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host "Installing PostgreSQL via winget..." -ForegroundColor Green
    winget install PostgreSQL.PostgreSQL --silent
    
    Write-Host "`nPostgreSQL installed!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open 'Stack Builder' from Start Menu" -ForegroundColor White
    Write-Host "2. Select PostgreSQL installation" -ForegroundColor White
    Write-Host "3. Install: Spatial Extensions -> PostGIS" -ForegroundColor White
} else {
    Write-Host "Winget not found. Please use one of these methods:" -ForegroundColor Yellow
    Write-Host "1. Manual installer: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor White
    Write-Host "2. Chocolatey: choco install postgresql15 postgis" -ForegroundColor White
}
```

---

## Post-Installation Steps

### 1. Verify Installation

```powershell
# Check PostgreSQL version
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" --version

# Check if service is running
Get-Service -Name "postgresql-x64-*"
```

### 2. Add PostgreSQL to PATH (Optional but Recommended)

**Windows 10/11:**
1. Search: "Environment Variables"
2. Click: "Edit the system environment variables"
3. Click: "Environment Variables" button
4. Under "System variables", select "Path" → Edit
5. Add: `C:\Program Files\PostgreSQL\15\bin`
6. Click OK and restart terminal

**Verify PATH:**
```powershell
psql --version
# Should output: psql (PostgreSQL) 15.x
```

### 3. Create Chenda Database

```powershell
# Connect to PostgreSQL (enter password when prompted)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres

# Inside psql prompt:
CREATE DATABASE chenda_db;
\c chenda_db
CREATE EXTENSION postgis;
\q
```

**Or as one-liner:**
```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE chenda_db;"
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"
```

### 4. Update Chenda Configuration

Edit `server/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chenda_db
DB_USER=postgres
DB_PASSWORD=your_password_here  ← UPDATE THIS!
```

---

## Troubleshooting

### "winget: command not found"
- Update Windows to latest version
- Or use Chocolatey/Manual installer

### "Service won't start"
```powershell
# Check service status
Get-Service postgresql-x64-15

# Start service
Start-Service postgresql-x64-15

# Or via net command (as Admin)
net start postgresql-x64-15
```

### "Port 5432 already in use"
Another process is using port 5432. Options:
1. Stop the conflicting service
2. Change PostgreSQL port in `postgresql.conf`
3. Update `DB_PORT` in `server/.env`

### "CREATE EXTENSION postgis" fails
PostGIS not installed. Install via:
1. Stack Builder (comes with PostgreSQL installer)
2. Or download from: https://postgis.net/install/

### "psql: command not found"
PostgreSQL bin directory not in PATH. Use full path:
```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
```

---

## Quick Start After Installation

```powershell
# 1. Start PostgreSQL (if not running)
Start-Service postgresql-x64-15

# 2. Create database
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE chenda_db;"
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"

# 3. Configure Chenda
cd C:\Users\ACER\Documents\CHENDA\chenda\server
# Edit .env file - update DB_PASSWORD

# 4. Run Chenda setup
.\start.bat
```

---

## Verification Checklist

Before running Chenda backend:

- [ ] PostgreSQL 15+ installed
- [ ] PostgreSQL service running
- [ ] PostGIS extension available
- [ ] Database `chenda_db` created
- [ ] PostGIS extension enabled in database
- [ ] `server/.env` configured with correct password
- [ ] psql accessible (in PATH or via full path)

Run this verification script:

```powershell
# server/verify-postgresql.ps1
Write-Host "PostgreSQL Installation Check" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check PostgreSQL service
$service = Get-Service -Name "postgresql-x64-*" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "[OK] PostgreSQL service found: $($service.Name)" -ForegroundColor Green
    Write-Host "     Status: $($service.Status)" -ForegroundColor Cyan
} else {
    Write-Host "[FAIL] PostgreSQL service not found" -ForegroundColor Red
    exit 1
}

# Check if psql exists
$psqlPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"
if (Test-Path $psqlPath) {
    Write-Host "[OK] psql.exe found" -ForegroundColor Green
} else {
    Write-Host "[WARN] psql.exe not found at default location" -ForegroundColor Yellow
}

# Test database connection
Write-Host "`nTesting database connection..." -ForegroundColor Cyan
node ../migrations/test-connection.js

Write-Host "`nVerification complete!" -ForegroundColor Green
```

---

## Next Steps

After PostgreSQL is installed and running:

1. **Run the setup script**: `.\start.bat` (from `server` directory)
2. **Or manual setup**:
   ```powershell
   node ../migrations/migrate.js up
   cd ../seeds && node seed.js && cd ../server
   npm run dev
   ```

3. **Verify backend**: http://localhost:3001/api/health

4. **Start frontend**: 
   ```powershell
   cd ../chenda-frontend
   npm run dev
   ```

5. **Open app**: http://localhost:3000
