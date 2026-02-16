@echo off
REM PostgreSQL Quick Start Script
REM Starts PostgreSQL directly without Windows service
REM Run this to start PostgreSQL for development

echo.
echo ================================================================
echo    Starting PostgreSQL for Chenda
echo ================================================================
echo.

set PG_BIN=C:\Program Files\PostgreSQL\15\bin
set PG_DATA=C:\Program Files\PostgreSQL\15\data

echo Checking if PostgreSQL is already running...
"%PG_BIN%\pg_ctl.exe" status -D "%PG_DATA%" >nul 2>&1
if %errorLevel% EQU 0 (
    echo PostgreSQL is already running!
    echo.
    goto :database_setup
)

echo Starting PostgreSQL...
"%PG_BIN%\pg_ctl.exe" start -D "%PG_DATA%" -l "%PG_DATA%\logfile" -w
if %errorLevel% NEQ 0 (
    echo ERROR: Failed to start PostgreSQL
    echo.
    echo Check logs at: %PG_DATA%\log
    pause
    exit /b 1
)

echo PostgreSQL started successfully!
echo.

:database_setup
echo Checking if chenda_db exists...
"%PG_BIN%\psql.exe" -U postgres -lqt 2>nul | find "chenda_db" >nul
if %errorLevel% EQU 0 (
    echo Database chenda_db already exists
) else (
    echo Creating chenda_db database...
    "%PG_BIN%\createdb.exe" -U postgres chenda_db
    if %errorLevel% NEQ 0 (
        echo ERROR: Failed to create database
        echo.
        echo Manual command:
        echo "%PG_BIN%\psql.exe" -U postgres -c "CREATE DATABASE chenda_db;"
        pause
        exit /b 1
    )
   echo Database created successfully!
)
echo.

echo Checking if PostGIS extension is installed...
"%PG_BIN%\psql.exe" -U postgres -d chenda_db -c "SELECT extname FROM pg_extension WHERE extname='postgis';" 2>nul | find "postgis" >nul
if %errorLevel% EQU 0 (
    echo PostGIS extension already installed
) else (
    echo Installing PostGIS extension...
    "%PG_BIN%\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"
    if %errorLevel% NEQ 0 (
        echo WARNING: Failed to install PostGIS extension
        echo You may need to install PostGIS using Stack Builder
    ) else (
        echo PostGIS extension installed successfully!
    )
)
echo.

echo ================================================================
echo    PostgreSQL is Ready!
echo ================================================================
echo.
echo Database: chenda_db
echo Host: localhost:5432
echo User: postgres
echo.
echo To start the backend server:
echo   cd server
echo   start.bat
echo.
pause
