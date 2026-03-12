# PostgreSQL Setup Guide for Chenda (Windows)

## Current Status
✅ PostgreSQL 15 is installed at `C:\Program Files\PostgreSQL\15`  
❌ PostgreSQL service is not initialized/running  
❌ Database not created yet

---

## 🚀 Quick Start (3 Steps)

### Step 1: Run Setup Script (AS ADMINISTRATOR)

1. **Open PowerShell as Administrator:**
   - Press `Win + X`
   - Click "Windows PowerShell (Admin)" or "Terminal (Admin)"
   - If asked "Do you want to allow this app to make changes?" → Click **Yes**

2. **Navigate to project:**
   ```powershell
   cd C:\Users\ACER\Documents\CHENDA\chenda
   ```

3. **Run the setup script:**
   ```powershell
   .\setup-postgresql.ps1
   ```

   **What this does:**
   - Initializes PostgreSQL data directory
   - Registers PostgreSQL as Windows service
   - Starts the PostgreSQL service
   - Sets auto-start on boot

   **Expected output:**
   ```
   [1/5] PostgreSQL Installation Found ✓
   [2/5] Initializing Data Directory... ✓
   [3/5] Registering PostgreSQL Service... ✓
   [4/5] Starting PostgreSQL Service... ✓
   [5/5] Configuring Auto-Start... ✓
   ```

---

### Step 2: Create Database

After the setup script completes, create the Chenda database:

```powershell
cd "C:\Program Files\PostgreSQL\15\bin"

# Create database
.\psql.exe -U postgres -c "CREATE DATABASE chenda;"

# Enable PostGIS extension
.\psql.exe -U postgres -d chenda -c "CREATE EXTENSION postgis;"
```

**Note:** You'll be prompted for the postgres password. This is the password you set during PostgreSQL installation.

---

### Step 3: Start Backend Server

1. **Update password in `.env`:**
   ```
   Open: C:\Users\ACER\Documents\CHENDA\chenda\server\.env
   Update: DB_PASSWORD=your_postgres_password
   ```

2. **Run the backend:**
   ```cmd
   cd C:\Users\ACER\Documents\CHENDA\chenda\server
   start.bat
   ```

   Or use the quick-start:
   ```cmd
   cd C:\Users\ACER\Documents\CHENDA\chenda
   quick-start.bat
   ```

**Expected output:**
```
✓ Database connected successfully
Server running on http://localhost:3001
```

---

## 🔍 Verify Everything Works

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{"status":"ok","database":"connected"}
```

---

## ❌ Troubleshooting

### "Cannot connect to PostgreSQL"

**Check if service is running:**
```powershell
Get-Service postgresql-x64-15
```

**If stopped, start it:**
```powershell
Start-Service postgresql-x64-15
```

### "Password authentication failed"

Update `server/.env`:
```env
DB_PASSWORD=your_actual_postgres_password
```

### "Database chenda does not exist"

```powershell
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -U postgres -c "CREATE DATABASE chenda;"
```

### "Extension postgis not found"

Install PostGIS:
1. Open Stack Builder (in PostgreSQL folder in Start Menu)
2. Select your PostgreSQL server
3. Find "PostGIS" under Spatial Extensions
4. Install it

Then enable in database:
```powershell
.\psql.exe -U postgres -d chenda -c "CREATE EXTENSION postgis;"
```

### "Cannot open service manager"

The setup script requires administrator privileges. Make sure you're running PowerShell as Administrator (see Step 1).

---

## 📋 Manual Alternative

If the automated script doesn't work, initialize manually:

```powershell
# Run as Administrator
cd "C:\Program Files\PostgreSQL\15\bin"

# Initialize data directory
.\initdb.exe -D "C:\Program Files\PostgreSQL\15\data" -U postgres -E UTF8

# Register service
.\pg_ctl.exe register -N postgresql-x64-15 -D "C:\Program Files\PostgreSQL\15\data"

# Start service
net start postgresql-x64-15

# Create database
.\psql.exe -U postgres -c "CREATE DATABASE chenda;"
.\psql.exe -U postgres -d chenda -c "CREATE EXTENSION postgis;"
```

---

## 🎯 Next Steps After Backend Starts

1. ✅ Backend running at `http://localhost:3001`
2. Start frontend:
   ```bash
   cd chenda-frontend
   npm run dev
   ```
3. Open browser: `http://localhost:3000`
4. Login and test the buyer dashboard!

---

## 📞 Need Help?

- PostgreSQL Docs: https://www.postgresql.org/docs/15/
- PostGIS Installation: https://postgis.net/install/
- Chenda Project Docs: See `README.md` in project root
