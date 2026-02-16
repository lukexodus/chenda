@echo off
echo ========================================
echo Complete PostGIS Installation
echo ========================================
echo.

REM Check admin
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: Must run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

set PG_PATH=C:\Program Files\PostgreSQL\15
set PG_DATA=%PG_PATH%\data
set DOWNLOADS=%USERPROFILE%\Downloads

echo Step 1: Stopping PostgreSQL...
"%PG_PATH%\bin\pg_ctl.exe" stop -D "%PG_DATA%" -m fast -w
timeout /t 3 >nul
echo   PostgreSQL stopped
echo.

echo Step 2: Finding PostGIS ZIP...
for %%f in ("%DOWNLOADS%\postgis-bundle-pg15*.zip") do set ZIP_FILE=%%f
if not exist "%ZIP_FILE%" (
    echo ERROR: PostGIS ZIP not found
    pause
    exit /b 1
)
echo   Found: %ZIP_FILE%
echo.

echo Step 3: Extracting PostGIS...
set EXTRACT=%TEMP%\postgis-final
if exist "%EXTRACT%" rd /s /q "%EXTRACT%"
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%EXTRACT%' -Force"
echo   Extracted
echo.

echo Step 4: Copying files...

REM Find bundle directory
for /d %%d in ("%EXTRACT%\*") do set BUNDLE_DIR=%%d
if not exist "%BUNDLE_DIR%\bin" set BUNDLE_DIR=%EXTRACT%

echo   Copying bin...
xcopy /Y /E /I "%BUNDLE_DIR%\bin\*" "%PG_PATH%\bin\" >nul 2>&1

echo   Copying lib...
xcopy /Y /E /I "%BUNDLE_DIR%\lib\*" "%PG_PATH%\lib\" >nul 2>&1

echo   Copying share...
xcopy /Y /E /I "%BUNDLE_DIR%\share\*" "%PG_PATH%\share\" >nul 2>&1

rd /s /q "%EXTRACT%" >nul 2>&1
echo   Files copied
echo.

echo Step 5: Starting PostgreSQL...
"%PG_PATH%\bin\pg_ctl.exe" start -D "%PG_DATA%" -w
timeout /t 3 >nul

"%PG_PATH%\bin\pg_ctl.exe" status -D "%PG_DATA%" 2>&1 | find "running"
if %errorLevel% EQU 0 (
    echo   PostgreSQL started
) else (
    echo   ERROR: PostgreSQL failed to start
    pause
    exit /b 1
)
echo.

echo Step 6: Enabling PostGIS extension...
echo.
"%PG_PATH%\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"

if %errorLevel% EQU 0 (
    echo.
    echo ========================================
    echo PostGIS Installation COMPLETE!
    echo ========================================
    echo.
    echo Verifying version:
    "%PG_PATH%\bin\psql.exe" -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
    echo.
    echo Next: Start the backend server
    echo   cd server
    echo   npm run dev
) else (
    echo.
    echo ERROR: Failed to enable extension
)

echo.
pause
