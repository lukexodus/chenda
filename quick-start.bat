@echo off
REM Quick Start Script for Chenda Project on Windows
REM This script checks PostgreSQL and guides you through setup

cls
echo.
echo ================================================================
echo    Chenda Project - Quick Start
echo ================================================================
echo.

REM Check if PostgreSQL is installed
if not exist "C:\Program Files\PostgreSQL\15" (
    echo [!] PostgreSQL 15 is NOT installed
    echo.
    echo Please install PostgreSQL 15 first:
    echo   1. Download: https://www.postgresql.org/download/windows/
    echo   2. Run installer
    echo   3. Remember the postgres password!
    echo   4. Install Stack Builder -^> PostGIS extension
    echo.
    pause
    exit /b 1
)

echo [+] PostgreSQL 15 installation found
echo.

REM Check if data directory is initialized
if not exist "C:\Program Files\PostgreSQL\15\data\postgresql.conf" (
    echo [!] PostgreSQL data directory is NOT initialized
    echo.
    echo Run this command as Administrator:
    echo   powershell -ExecutionPolicy Bypass -File setup-postgresql.ps1
    echo.
    echo Instructions:
    echo   1. Right-click PowerShell
    echo   2. Select "Run as Administrator"
    echo   3. Navigate to: %CD%
    echo   4. Run: .\setup-postgresql.ps1
    echo.
    pause
    exit /b 1
)

echo [+] PostgreSQL data directory initialized
echo.

REM Check if service is running
sc query postgresql-x64-15 | find "RUNNING" >nul 2>&1
if errorlevel 1 (
    echo [!] PostgreSQL service is NOT running
    echo.
    echo Run as Administrator:
    echo   net start postgresql-x64-15
    echo.
    echo Or run the setup script:
    echo   powershell -ExecutionPolicy Bypass -File setup-postgresql.ps1
    echo.
    pause
    exit /b 1
)

echo [+] PostgreSQL service is running
echo.

REM Test database connection
echo [*] Testing database connection...
cd server
node ..\migrations\test-connection.js

if errorlevel 1 (
    echo.
    echo [!] Cannot connect to database
    echo.
    echo Possible fixes:
    echo   1. Create database:
    echo      "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres ^
    echo        -c "CREATE DATABASE chenda_db;"
    echo.
    echo   2. Enable PostGIS:
    echo      "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres ^
    echo        -d chenda_db -c "CREATE EXTENSION postgis;"
    echo.
    echo   3. Update DB_PASSWORD in server\.env
    echo.
    pause
    exit /b 1
)

echo [+] Database connection successful!
echo.

REM Run migrations
echo [*] Checking migrations...
node ..\migrations\migrate.js status >nul 2>&1

if errorlevel 1 (
    echo [*] Running migrations...
    node ..\migrations\migrate.js up
    if errorlevel 1 (
        echo [X] Migration failed
        pause
        exit /b 1
    )
    echo [+] Migrations completed
) else (
    echo [+] Migrations up to date
)
echo.

REM Seed database
echo [*] Seeding database...
cd ..\seeds
node seed.js
cd ..\server
echo.

echo ================================================================
echo    Starting Backend Server
echo ================================================================
echo.
echo Backend: http://localhost:3001
echo Frontend: Open new terminal and run:
echo   cd chenda-frontend
echo   npm run dev
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
