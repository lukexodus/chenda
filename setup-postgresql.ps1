# PostgreSQL Setup Script for Windows
# This script MUST be run as Administrator
# Right-click PowerShell and select "Run as Administrator"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   PostgreSQL Setup for Chenda Project" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "  1. Right-click on PowerShell" -ForegroundColor White
    Write-Host "  2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "  3. Navigate to: $(Get-Location)" -ForegroundColor White
    Write-Host "  4. Run: .\setup-postgresql.ps1" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

$pgPath = "C:\Program Files\PostgreSQL\18"
$pgBin = "$pgPath\bin"
$pgData = "$pgPath\data"

# Check if PostgreSQL is installed
if (-not (Test-Path $pgPath)) {
    Write-Host "ERROR: PostgreSQL 18 not found at $pgPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL 18:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Run the installer" -ForegroundColor White
    Write-Host "  3. Remember the postgres password you set!" -ForegroundColor White
    Write-Host "  4. Install Stack Builder -> PostGIS extension" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host "[1/5] PostgreSQL Installation Found" -ForegroundColor Green
Write-Host "      Location: $pgPath" -ForegroundColor Gray
Write-Host ""

# Check if data directory exists
if (Test-Path "$pgData\postgresql.conf") {
    Write-Host "[2/5] Data Directory Already Initialized" -ForegroundColor Green
    Write-Host "      Location: $pgData" -ForegroundColor Gray
} else {
    Write-Host "[2/5] Initializing Data Directory..." -ForegroundColor Yellow
    
    # Create data directory if it doesn't exist
    if (-not (Test-Path $pgData)) {
        New-Item -ItemType Directory -Path $pgData -Force | Out-Null
    }
    
    # Initialize PostgreSQL database cluster
    Write-Host "      Running: initdb..." -ForegroundColor Gray
    try {
        & "$pgBin\initdb.exe" -D "$pgData" -U postgres -E UTF8 -A trust --locale=C
        if ($LASTEXITCODE -ne 0) {
            throw "initdb failed with exit code $LASTEXITCODE"
        }
        Write-Host "      Data directory initialized successfully!" -ForegroundColor Green
    } catch {
        Write-Host "      ERROR: Failed to initialize data directory" -ForegroundColor Red
        Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
        pause
        exit 1
    }
}
Write-Host ""

# Check if service is registered
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue

if ($null -eq $service) {
    Write-Host "[3/5] Registering PostgreSQL Service..." -ForegroundColor Yellow
    
    try {
        & "$pgBin\pg_ctl.exe" register -N "postgresql-x64-18" -D "$pgData"
        Write-Host "      Service registered successfully!" -ForegroundColor Green
    } catch {
        Write-Host "      ERROR: Failed to register service" -ForegroundColor Red
        Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
        pause
        exit 1
    }
} else {
    Write-Host "[3/5] PostgreSQL Service Already Registered" -ForegroundColor Green
    Write-Host "      Service Name: postgresql-x64-18" -ForegroundColor Gray
}
Write-Host ""

# Start the service
Write-Host "[4/5] Starting PostgreSQL Service..." -ForegroundColor Yellow

$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue

if ($service.Status -eq "Running") {
    Write-Host "      PostgreSQL is already running" -ForegroundColor Green
} else {
    try {
        Start-Service -Name "postgresql-x64-18"
        Start-Sleep -Seconds 3
        
        $service = Get-Service -Name "postgresql-x64-18"
        if ($service.Status -eq "Running") {
            Write-Host "      PostgreSQL service started successfully!" -ForegroundColor Green
        } else {
            Write-Host "      WARNING: Service started but status is: $($service.Status)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "      ERROR: Failed to start service" -ForegroundColor Red
        Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
        
        Write-Host ""
        Write-Host "      Trying manual start..." -ForegroundColor Yellow
        try {
            & "$pgBin\pg_ctl.exe" start -D "$pgData"
            Write-Host "      Manual start successful!" -ForegroundColor Green
        } catch {
            Write-Host "      Manual start also failed" -ForegroundColor Red
            pause
            exit 1
        }
    }
}
Write-Host ""

# Set PostgreSQL to auto-start
Write-Host "[5/5] Configuring Auto-Start..." -ForegroundColor Yellow
try {
    Set-Service -Name "postgresql-x64-18" -StartupType Automatic
    Write-Host "      PostgreSQL set to start automatically" -ForegroundColor Green
} catch {
    Write-Host "      WARNING: Could not set auto-start" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "================================================================" -ForegroundColor Green
Write-Host "   PostgreSQL Setup Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

# Test connection
Write-Host "Testing PostgreSQL connection..." -ForegroundColor Cyan
$env:PATH = "$pgBin;$env:PATH"

Start-Sleep -Seconds 2

try {
    $testResult = & "$pgBin\psql.exe" -U postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: PostgreSQL is running and accessible!" -ForegroundColor Green
        Write-Host ""
        Write-Host "PostgreSQL Version:" -ForegroundColor Cyan
        Write-Host "$testResult" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: Could not connect to PostgreSQL" -ForegroundColor Yellow
        Write-Host "You may need to set the postgres user password" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Could not test connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   Next Steps" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Set postgres password (if you haven't):" -ForegroundColor Yellow
Write-Host '   cd "C:\Program Files\PostgreSQL\18\bin"' -ForegroundColor White
Write-Host '   .\psql.exe -U postgres' -ForegroundColor White
Write-Host "   ALTER USER postgres WITH PASSWORD 'your_password';" -ForegroundColor White
Write-Host ""
Write-Host "2. Create Chenda database:" -ForegroundColor Yellow
Write-Host '   .\psql.exe -U postgres -c "CREATE DATABASE chenda_db;"' -ForegroundColor White
Write-Host '   .\psql.exe -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"' -ForegroundColor White
Write-Host ""
Write-Host "3. Update server/.env with your postgres password" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Run the backend setup script:" -ForegroundColor Yellow
Write-Host "   cd server" -ForegroundColor White
Write-Host "   .\start.bat" -ForegroundColor White
Write-Host ""

pause
