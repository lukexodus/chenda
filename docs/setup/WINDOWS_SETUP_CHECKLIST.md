# Windows Setup Checklist for Chenda

Complete this checklist to set up Chenda on a new Windows machine.

---

## ✅ Pre-Setup Checklist

### Downloads (Complete Before Starting)

- [ ] **Node.js 20 LTS**
  - Download: https://nodejs.org/
  - File: `node-v20.x.x-x64.msi`
  - Run installer with default options

- [ ] **PostgreSQL 15**
  - Download: https://www.postgresql.org/download/windows/
  - File: `postgresql-15.x-windows-x64.exe`
  - **IMPORTANT**: Note the password you set for `postgres` user
  - Keep default port: 5432

- [ ] **PostGIS Bundle**
  - Download: https://download.osgeo.org/postgis/windows/pg15/postgis-bundle-pg15-3.6.1x64.zip
  - Save to: `Downloads` folder
  - **Do not extract yet**

- [ ] **Git for Windows** (if not installed)
  - Download: https://git-scm.com/download/win
  - Includes Git Bash (required for scripts)

---

## ✅ Terminal Configuration

- [ ] Open **Windows Terminal** (or install from Microsoft Store)
- [ ] Go to: Settings → Default Profile
- [ ] Select: **Git Bash** (or WSL if you have it)
- [ ] Click "Save"
- [ ] Close and reopen terminal

**Why Bash?**
- More reliable for running scripts
- Avoids PowerShell execution policy issues
- Better compatibility with project scripts

---

## ✅ Installation Steps

### Step 1: Install Node.js
- [ ] Run `node-v20.x.x-x64.msi`
- [ ] Accept defaults and complete installation
- [ ] Verify in terminal: `node --version`
- [ ] Expected: `v20.x.x`

### Step 2: Install PostgreSQL
- [ ] Run `postgresql-15.x-windows-x64.exe`
- [ ] Set password for `postgres` user: **_____________** (write it down!)
- [ ] Keep default port: 5432
- [ ] Uncheck "Stack Builder" (we'll install PostGIS manually)
- [ ] Complete installation
- [ ] Verify in terminal: `psql --version`
- [ ] Expected: `psql (PostgreSQL) 15.x`

### Step 3: Clone Repository
```bash
cd ~/Documents  # or wherever you keep projects
git clone <repository-url> chenda
cd chenda
```
- [ ] Repository cloned
- [ ] Changed to project directory

### Step 4: Install PostGIS
```bash
# Make sure PostGIS ZIP is in Downloads folder
# Run installation script (will open admin window)
powershell -ExecutionPolicy Bypass -File install-postgis-simple.ps1
```

**In the admin PowerShell window that opens:**
- [ ] Script found the PostGIS ZIP file
- [ ] Files extracted successfully
- [ ] Files copied to PostgreSQL (may show 1 error - ignore if others succeed)
- [ ] PostgreSQL restarted
- [ ] Extension created successfully
- [ ] Saw: `3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`

### Step 5: Setup Environment
```bash
# Copy environment templates
cp .env.example .env
cp server/.env.example server/.env

# Edit .env file
notepad .env
```

**In Notepad:**
- [ ] Find line: `DB_PASSWORD=your_secure_password_here`
- [ ] Change to: `DB_PASSWORD=<your_postgres_password>`
- [ ] Save and close

```bash
# Also edit server/.env
notepad server/.env
```

**In Notepad:**
- [ ] Find line: `DB_PASSWORD=your_secure_password_here`
- [ ] Change to: `DB_PASSWORD=<your_postgres_password>`
- [ ] Save and close

### Step 6: Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install frontend dependencies
cd chenda-frontend
npm install
cd ..
```

- [ ] Root dependencies installed
- [ ] Server dependencies installed
- [ ] Frontend dependencies installed
- [ ] No errors (warnings are OK)

### Step 7: Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE chenda_db;"
# Enter password when prompted

# Verify PostGIS (should already be enabled from Step 4)
psql -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
# Should show: 3.6 USE_GEOS=1...
```

- [ ] Database created (or "already exists" message)
- [ ] PostGIS version displayed

### Step 8: Run Migrations
```bash
node migrations/migrate.js up
```

**Expected output:**
```
🔗 Connecting to database...
✅ Connected to database: chenda_db

📋 Found 3 pending migrations
  ✓ 001_create_tables.sql (Applied in Xms)
  ✓ 002_create_indexes.sql (Applied in Xms)
  ✓ 003_create_session_table.sql (Applied in Xms)

✅ All migrations completed successfully!
```

- [ ] 3 migrations applied
- [ ] No errors

### Step 9: Seed Database
```bash
node seeds/seed.js
```

**Expected output:**
```
✅ Seeding completed successfully!

📊 Summary:
  - Product Types: 180
  - Users: 10 (9 sellers, 1 buyer)
  - Products: 30
```

- [ ] 180 product types inserted
- [ ] 10 users created
- [ ] 30 products created

### Step 10: Start Backend Server
```bash
cd server
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:3001
✓ Database connected successfully
```

- [ ] Server started on port 3001
- [ ] Database connected
- [ ] No errors

**Leave this terminal open!**

### Step 11: Start Frontend (New Terminal)
Open a **new terminal** (keep the backend running):

```bash
cd chenda-frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

- [ ] Frontend started on port 3000
- [ ] No errors

**Leave this terminal open too!**

---

## ✅ Verification

### Backend Health Check
Open browser: http://localhost:3001/api/health

- [ ] Shows: `{"success":true, "message":"Server is running"...}`

### Frontend Access
Open browser: http://localhost:3000

- [ ] Landing page loads
- [ ] Can navigate to Login page
- [ ] Can navigate to Register page

### Test Registration
1. Go to: http://localhost:3000/auth/register
2. Fill in:
   - Name: Test Buyer
   - Email: buyer@example.com
   - Password: password123
   - Type: Buyer
3. Click "Register"

- [ ] Registration successful
- [ ] Redirected to /buyer dashboard

### Test Buyer Dashboard
After registration, you should see:

- [ ] Search form with location input
- [ ] Weight sliders (Min/Max kg)
- [ ] "Search Products" button
- [ ] Empty state message

Try searching:
1. Enter location: "Quezon City"
2. Click "Search Products"

- [ ] Products appear in grid
- [ ] Each product shows freshness score
- [ ] Can click "View Details"
- [ ] Map appears in modal
- [ ] Can add to cart

---

## ✅ Final Checklist

### Servers Running
- [ ] Backend: http://localhost:3001 ✅
- [ ] Frontend: http://localhost:3000 ✅
- [ ] PostgreSQL service running ✅

### Database
- [ ] Database `chenda_db` created ✅
- [ ] PostGIS extension enabled ✅
- [ ] Migrations applied (3) ✅
- [ ] Data seeded (180 types, 10 users, 30 products) ✅

### Application
- [ ] Can register new users ✅
- [ ] Can login ✅
- [ ] Buyer dashboard accessible ✅
- [ ] Can search products ✅
- [ ] Can view product details ✅
- [ ] Can add to cart ✅

---

## 🎉 Success!

Your Chenda application is now fully set up and running!

### What's Next?

1. **Explore the API**
   - Import Postman collection: `postman/Chenda_API.postman_collection.json`
   - Read API docs: `API_DOCUMENTATION.md`

2. **Test All Features**
   - Register as seller
   - Add products
   - Test search algorithm
   - Place orders

3. **Development**
   - Frontend code: `chenda-frontend/src/`
   - Backend code: `server/`
   - Algorithm: `server/algorithm/`

---

## 🆘 Having Issues?

### Quick Fixes

**Backend won't start:**
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# View backend logs
cd server
npm run dev
```

**Frontend errors:**
```bash
cd chenda-frontend
rm -rf .next node_modules
npm install
npm run dev
```

**Database errors:**
```bash
# Check database exists
psql -U postgres -l | grep chenda_db

# Check PostGIS
psql -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
```

### Get Help
- 📖 Full troubleshooting guide: [SETUP_GUIDE.md](SETUP_GUIDE.md#common-issues--solutions)
- 📋 Detailed setup guide: [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 💡 Tips for Daily Development

### Starting Work
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd chenda-frontend
npm run dev
```

### Stopping Servers
- Press `Ctrl+C` in each terminal

### Restarting PostgreSQL
```bash
# Stop
"C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" stop -D "C:\Program Files\PostgreSQL\15\data" -m fast

# Start
"C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\15\data" -w
```

### Reset Database
```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE chenda_db;"
psql -U postgres -c "CREATE DATABASE chenda_db;"
psql -U postgres -d chenda_db -c "CREATE EXTENSION postgis CASCADE;"

# Re-run migrations and seeds
node migrations/migrate.js up
node seeds/seed.js
```
