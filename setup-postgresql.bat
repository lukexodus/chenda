@echo off
REM PostgreSQL Setup Script for Chenda Project (Windows)
REM This script must be run as Administrator
REM Right-click and select "Run as administrator"

echo.
echo ================================================================
echo    PostgreSQL Setup for Chenda Project
echo ================================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: This script must run as Administrator!
    echo.
    echo Please:
    echo   1. Right-click on this file
    echo   2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

set PG_PATH=C:\Program Files\PostgreSQL\15
set PG_BIN=%PG_PATH%\bin
set PG_DATA=%PG_PATH%\data

REM Check if PostgreSQL is installed
echo [1/5] Checking PostgreSQL installation...
if not exist "%PG_BIN%\postgres.exe" (
    echo ERROR: PostgreSQL 15 not found at %PG_PATH%
    echo.
    echo Please install PostgreSQL 15:
    echo   Download: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)
echo       Location: %PG_PATH%
echo.

REM Check if data directory is initialized
echo [2/5] Checking data directory...
if exist "%PG_DATA%\postgresql.conf" (
    echo       Data directory already initialized, skipping...
) else (
    echo       Initializing data directory...
    "%PG_BIN%\initdb.exe" -D "%PG_DATA%" -U postgres -E UTF8 -A trust --locale=C
    if %errorLevel% NEQ 0 (
        echo       ERROR: Failed to initialize data directory
        pause
        exit /b 1
    )
    echo       Data directory initialized successfully!
)
echo.

REM Check if service is registered
echo [3/5] Checking PostgreSQL service...
sc query postgresql-x64-15 >nul 2>&1
if %errorLevel% EQU 0 (
    echo       Service already registered, skipping...
) else (
    echo       Registering PostgreSQL service...
    "%PG_BIN%\pg_ctl.exe" register -N postgresql-x64-15 -D "%PG_DATA%"
    if %errorLevel% NEQ 0 (
        echo       ERROR: Failed to register service
        pause
        exit /b 1
    )
    echo       Service registered successfully!
)
echo.

REM Start the service
echo [4/5] Starting PostgreSQL service...
sc query postgresql-x64-15 | find "RUNNING" >nul 2>&1
if %errorLevel% EQU 0 (
    echo       PostgreSQL is already running
) else (
    net start postgresql-x64-15 >nul 2>&1
    if %errorLevel% EQU 0 (
        echo       PostgreSQL service started successfully!
    ) else (
        echo       WARNING: Service start via 'net start' failed, trying pg_ctl...
        "%PG_BIN%\pg_ctl.exe" start -D "%PG_DATA%" -w
        if %errorLevel% EQU 0 (
            echo       PostgreSQL started successfully with pg_ctl!
        ) else (
            echo       ERROR: Failed to start PostgreSQL
            echo.
            echo       Checking logs at: %PG_DATA%\log
            pause
            exit /b 1
        )
    )
)

REM Wait for PostgreSQL to be ready
timeout /t 3 /nobreak >nul 2>&1
echo.

REM Configure auto-start
echo [5/5] Configuring auto-start...
sc config postgresql-x64-15 start=auto >nul 2>&1
echo       PostgreSQL set to start automatically
echo.

echo ================================================================
echo    PostgreSQL Setup Complete!
echo ================================================================
echo.

REM Test connection
echo Testing PostgreSQL connection...
"%PG_BIN%\psql.exe" -U postgres -c "SELECT version();" >nul 2>&1
if %errorLevel% EQU 0 (
    echo SUCCESS: PostgreSQL is running and accessible!
    echo.
    "%PG_BIN%\psql.exe" -U postgres -c "SELECT version();"
) else (
    echo WARNING: Could not connect to PostgreSQL
    echo You may need to set a password for the postgres user
)

echo.
echo ================================================================
echo    Next Steps
echo ================================================================
echo.
echo 1. Create Chenda database:
echo    "%PG_BIN%\psql.exe" -U postgres -c "CREATE DATABASE chenda_db;"
echo    "%PG_BIN%\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"
echo.
echo 2. Update server\.env if you set a postgres password:
echo    DB_PASSWORD=your_password
echo.
echo 3. Start the backend server:
echo    cd server
echo    start.bat
echo.
pause
