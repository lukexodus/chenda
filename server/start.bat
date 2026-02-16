@echo off
REM Chenda Backend Setup & Start Script for Windows
REM Run this from Command Prompt or double-click
REM This script must be run from the server directory

echo.
echo ================================================================
echo    Chenda Backend Setup and Start
echo ================================================================
echo.

REM Check if PostgreSQL is installed
echo [*] Checking PostgreSQL installation...
sc query postgresql-x64-15 >nul 2>&1
if errorlevel 1 (
    sc query postgresql-x64-16 >nul 2>&1
    if errorlevel 1 (
        echo [X] PostgreSQL service not found!
        echo.
        echo PostgreSQL is not installed or service is not registered.
        echo.
        echo Please install PostgreSQL 15+ with PostGIS:
        echo   1. Quick install: winget install PostgreSQL.PostgreSQL
        echo   2. Or download from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
        echo.
        echo After installation:
        echo   - Use Stack Builder to install PostGIS extension
        echo   - Run this script again
        echo.
        echo For detailed instructions, see: INSTALL_POSTGRESQL_WINDOWS.md
        echo.
        pause
        exit /b 1
    )
)
echo [+] PostgreSQL service found
echo.

REM Check if .env exists
if not exist .env (
    echo [!] .env file not found - creating default configuration...
    (
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=chenda_db
        echo DB_USER=postgres
        echo DB_PASSWORD=postgres
        echo.
        echo # Server Configuration
        echo PORT=3001
        echo NODE_ENV=development
        echo.
        echo # Session Configuration
        echo SESSION_SECRET=chenda-super-secret-key-change-this-in-production-2026
        echo.
        echo # CORS Configuration
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # File Upload Configuration
        echo UPLOAD_DIR=./uploads
        echo MAX_FILE_SIZE=5242880
    ) > .env
    echo [+] Created .env file with default settings
    echo [!] IMPORTANT: Update DB_PASSWORD in .env if needed!
    echo.
)

echo [*] Testing database connection...
node ..\migrations\test-connection.js

if errorlevel 1 (
    echo.
    echo [X] Cannot connect to PostgreSQL database!
    echo.
    echo Common Solutions:
    echo.
    echo 1. If PostgreSQL service is not running:
    echo    Run as Administrator: net start postgresql-x64-15
    echo.
    echo 2. If PostgreSQL needs initialization:
    echo    Run as Administrator from project root:
    echo    powershell -ExecutionPolicy Bypass -File setup-postgresql.ps1
    echo.
    echo 3. Create the database manually:
    echo    "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE chenda_db;"
    echo    "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"
    echo.
    echo 4. Update DB_PASSWORD in server\.env if needed
    echo.
    pause
    exit /b 1
)

echo [+] Database connection successful!
echo.

echo [*] Running database migrations...
node ..\migrations\migrate.js up

if errorlevel 1 (
    echo [X] Migration failed!
    pause
    exit /b 1
)

echo [+] Migrations completed!
echo.

echo [*] Seeding database with test data...
cd ..\seeds
node seed.js
cd ..\server

echo [+] Database seeding completed!
echo.
echo ================================================================
echo    Starting Backend Server
echo ================================================================
echo.
echo Server will run at: http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

npm run dev
