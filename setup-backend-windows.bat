@echo off
REM ============================================
REM Chenda Backend Setup Script for Windows
REM ============================================

echo.
echo ============================================
echo    Chenda Backend Setup for Windows
echo ============================================
echo.

REM Check if PostgreSQL is installed
echo [1/6] Checking PostgreSQL installation...
where psql >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [ERROR] PostgreSQL not found!
    echo.
    echo Please install PostgreSQL 15 first:
    echo   1. Download from: https://www.postgresql.org/download/windows/
    echo   2. Run the installer and note the password you set for 'postgres' user
    echo   3. Add PostgreSQL bin directory to PATH
    echo.
    pause
    exit /b 1
)
echo [OK] PostgreSQL found
echo.

REM Check if Node.js is installed
echo [2/6] Checking Node.js installation...
where node >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js first:
    echo   Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
node --version
echo [OK] Node.js found
echo.

REM Setup .env file
echo [3/6] Setting up environment variables...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo [INFO] Created .env from .env.example
        echo.
        echo IMPORTANT: Edit .env and set DB_PASSWORD to your PostgreSQL password
        notepad .env
        echo.
        echo Press any key after you've saved your .env file...
        pause >nul
    ) else (
        echo [ERROR] .env.example not found!
        exit /b 1
    )
) else (
    echo [OK] .env already exists
)
echo.

REM Install dependencies
echo [4/6] Installing dependencies...
call npm install
if %errorLevel% NEQ 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Create database
echo [5/6] Creating database...
echo.
echo This will create the 'chenda_db' database.
echo You will be prompted for your PostgreSQL password.
echo.
psql -U postgres -c "CREATE DATABASE chenda_db;" 2>nul
REM Ignore error if database already exists
echo [OK] Database ready
echo.

REM Install PostGIS extension
echo [6/6] Enabling PostGIS extension...
echo.
echo You will be prompted for your PostgreSQL password.
echo.
psql -U postgres -d chenda_db -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"
if %errorLevel% NEQ 0 (
    echo.
    echo [WARNING] PostGIS extension failed to enable
    echo.
    echo PostGIS is required for geospatial features.
    echo.
    echo To install PostGIS:
    echo   1. Download PostGIS bundle from: https://download.osgeo.org/postgis/windows/pg15/
    echo   2. Extract the ZIP file
    echo   3. Copy bin, lib, and share folders to your PostgreSQL installation directory
    echo   4. Restart PostgreSQL
    echo   5. Run: psql -U postgres -d chenda_db -c "CREATE EXTENSION postgis CASCADE;"
    echo.
    pause
)
echo.

echo ============================================
echo    Setup Complete!
echo ============================================
echo.
echo Next steps:
echo   1. Run migrations:  node migrations\migrate.js up
echo   2. Seed database:   node seeds\seed.js
echo   3. Start server:    cd server ^&^& npm run dev
echo.
pause
