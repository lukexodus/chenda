# Chenda Backend Setup Verification Script
# Run this to check if everything is properly configured

Write-Host "`n================================" -ForegroundColor Green
Write-Host "  Chenda Setup Verification" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

$allOk = $true

# Check 1: PostgreSQL Service
Write-Host "[1/7] Checking PostgreSQL service..." -ForegroundColor Cyan
$pgService = Get-Service -Name "postgresql-x64-*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "      [OK] PostgreSQL service running: $($pgService.Name)" -ForegroundColor Green
    } else {
        Write-Host "      [!] PostgreSQL service found but not running: $($pgService.Name)" -ForegroundColor Yellow
        Write-Host "          Start with: Start-Service $($pgService.Name)" -ForegroundColor Gray
        $allOk = $false
    }
} else {
    Write-Host "      [X] PostgreSQL service not found" -ForegroundColor Red
    Write-Host "          Install with: .\install-postgresql.ps1" -ForegroundColor Gray
    $allOk = $false
}

# Check 2: psql.exe
Write-Host "`n[2/7] Checking psql.exe..." -ForegroundColor Cyan
$psqlPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"
if (Test-Path $psqlPath) {
    Write-Host "      [OK] psql.exe found" -ForegroundColor Green
} else {
    Write-Host "      [!] psql.exe not found at default location" -ForegroundColor Yellow
    Write-Host "          Expected: $psqlPath" -ForegroundColor Gray
}

# Check 3: .env file
Write-Host "`n[3/7] Checking .env file..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "      [OK] .env file exists" -ForegroundColor Green
    
    # Check if password is still default
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DB_PASSWORD=postgres") {
        Write-Host "      [!] DB_PASSWORD is still default 'postgres'" -ForegroundColor Yellow
        Write-Host "          Update if you set a different password during installation" -ForegroundColor Gray
    }
} else {
    Write-Host "      [!] .env file not found" -ForegroundColor Yellow
    Write-Host "          Will be created on first run of start.bat" -ForegroundColor Gray
}

# Check 4: Node.js
Write-Host "`n[4/7] Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "      [OK] Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "      [X] Node.js not found" -ForegroundColor Red
    Write-Host "          Download from: https://nodejs.org/" -ForegroundColor Gray
    $allOk = $false
}

# Check 5: npm packages
Write-Host "`n[5/7] Checking npm packages..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "      [OK] node_modules directory exists" -ForegroundColor Green
} else {
    Write-Host "      [!] node_modules not found" -ForegroundColor Yellow
    Write-Host "          Run: npm install" -ForegroundColor Gray
    $allOk = $false
}

# Check 6: Database connection
Write-Host "`n[6/7] Testing database connection..." -ForegroundColor Cyan
if ($pgService -and $pgService.Status -eq "Running") {
    try {
        $testOutput = node ../migrations/test-connection.js 2>&1
        if $LASTEXITCODE -eq 0) {
            Write-Host "      [OK] Database connection successful" -ForegroundColor Green
        } else {
            Write-Host "      [X] Database connection failed" -ForegroundColor Red
            Write-Host "          Check:" -ForegroundColor Gray
            Write-Host "          - Database 'chenda_db' exists" -ForegroundColor Gray
            Write-Host "          - Password in .env is correct" -ForegroundColor Gray
            Write-Host "          - PostgreSQL is accepting connections" -ForegroundColor Gray
            $allOk = $false
        }
    } catch {
        Write-Host "      [X] Cannot test connection: $_" -ForegroundColor Red
        $allOk = $false
    }
} else {
    Write-Host "      [!] Skipped (PostgreSQL not running)" -ForegroundColor Yellow
    $allOk = $false
}

# Check 7: Migrations
Write-Host "`n[7/7] Checking migrations..." -ForegroundColor Cyan
if ($pgService -and $pgService.Status -eq "Running") {
    try {
        $migrationStatus = node ../migrations/migrate.js status 2>&1
        if ($migrationStatus -match "All migrations applied") {
            Write-Host "      [OK] All migrations applied" -ForegroundColor Green
        } elseif ($migrationStatus -match "Pending migrations") {
            Write-Host "      [!] Pending migrations found" -ForegroundColor Yellow
            Write-Host "          Run: node ../migrations/migrate.js up" -ForegroundColor Gray
        } else {
            Write-Host "      [!] Migration status unknown" -ForegroundColor Yellow
            Write-Host "          Run: node ../migrations/migrate.js up" -ForegroundColor Gray
        }
    } catch {
        Write-Host "      [!] Cannot check migrations (may need database creation)" -ForegroundColor Yellow
    }
} else {
    Write-Host "      [!] Skipped (PostgreSQL not running)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n================================" -ForegroundColor Green
Write-Host "  Verification Summary" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

if ($allOk) {
    Write-Host "[SUCCESS] All checks passed!`n" -ForegroundColor Green
    Write-Host "You can now start the backend:" -ForegroundColor White
    Write-Host "  start.bat`n" -ForegroundColor Cyan
} else {
    Write-Host "[INCOMPLETE] Some checks failed`n" -ForegroundColor Yellow
    Write-Host "Next steps:" -ForegroundColor White
    
    if (-not $pgService) {
        Write-Host "  1. Install PostgreSQL: .\install-postgresql.ps1" -ForegroundColor Cyan
    } elseif ($pgService.Status -ne "Running") {
        Write-Host "  1. Start PostgreSQL: Start-Service $($pgService.Name)" -ForegroundColor Cyan
    }
    
    Write-Host "  2. Create database (if not exists):" -ForegroundColor Cyan
    Write-Host '     psql -U postgres -c "CREATE DATABASE chenda_db;"' -ForegroundColor Gray
    Write-Host '     psql -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"' -ForegroundColor Gray
    
    Write-Host "  3. Update server/.env with correct DB_PASSWORD" -ForegroundColor Cyan
    
    Write-Host "  4. Run: start.bat`n" -ForegroundColor Cyan
}

Write-Host "For detailed help, see:" -ForegroundColor Yellow
Write-Host "  - INSTALL_POSTGRESQL_WINDOWS.md (Installation guide)" -ForegroundColor White
Write-Host "  - START_HERE.md (Quick start guide)`n" -ForegroundColor White
