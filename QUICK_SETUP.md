# Quick Setup Summary

## For Windows Users

### Prerequisites (Download & Install First)
1. **Node.js 20 LTS**: https://nodejs.org/
2. **PostgreSQL 15**: https://www.postgresql.org/download/windows/
3. **PostGIS Bundle**: https://download.osgeo.org/postgis/windows/pg15/postgis-bundle-pg15-3.6.1x64.zip

### Terminal Setup
- Open Windows Terminal → Settings → Default Profile → Select **Git Bash** (or WSL Bash)
- **Why Bash?** More reliable than PowerShell for scripts, avoids execution policy issues

### Automated Setup
```bash
# Run setup script
./setup-backend-windows.bat

# Follow prompts and enter PostgreSQL password when asked
```

### Manual Setup (If Script Fails)
See detailed instructions in [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## For Linux Users

### Prerequisites
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib postgresql-15-postgis-3 nodejs npm

# CentOS/RHEL
sudo dnf install postgresql-server postgis nodejs
```

### Automated Setup
```bash
chmod +x setup-backend-linux.sh
./setup-backend-linux.sh
```

---

## After Setup

### 1. Run Migrations
```bash
node migrations/migrate.js up
```

### 2. Seed Database
```bash
node seeds/seed.js
```

### 3. Start Backend
```bash
cd server
npm run dev
```

### 4. Start Frontend
```bash
cd chenda-frontend
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

---

## Environment Variables

Copy and edit the `.env.example` files:
```bash
cp .env.example .env
cp server/.env.example server/.env
```

Edit `.env` and set:
```env
DB_PASSWORD=your_postgres_password
```

**NEVER commit `.env` files to git!**

---

## Troubleshooting

See detailed troubleshooting guide in [SETUP_GUIDE.md](./SETUP_GUIDE.md#common-issues--solutions)

### Common Issues:
- ❌ **Empty password error** → Set `DB_PASSWORD` in `.env`
- ❌ **PostGIS not found** → Install PostGIS, restart PostgreSQL, enable extension
- ❌ **PowerShell execution policy** → Switch to Bash terminal
- ❌ **Port in use** → Kill process using that port
- ❌ **Connection refused** → Start PostgreSQL service

---

## Need More Help?

📖 **Full Documentation**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

Includes:
- Detailed step-by-step instructions
- What worked vs what didn't (lessons learned)
- Complete troubleshooting guide
- Production deployment notes
