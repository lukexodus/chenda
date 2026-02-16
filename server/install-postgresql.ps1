# PostgreSQL Installation Helper for Chenda
# Run this script from PowerShell to install PostgreSQL on Windows

Write-Host "`n================================" -ForegroundColor Green
Write-Host "  Chenda PostgreSQL Installer" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

# Check if PostgreSQL is already installed
$pgService = Get-Service -Name "postgresql-x64-*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "[OK] PostgreSQL service already installed: $($pgService.Name)" -ForegroundColor Green
    Write-Host "     Status: $($pgService.Status)`n" -ForegroundColor Cyan
    
    if ($pgService.Status -ne "Running") {
        Write-Host "[!] PostgreSQL service is not running" -ForegroundColor Yellow
        $startService = Read-Host "Start PostgreSQL service now? (y/n)"
        if ($startService -eq 'y') {
            try {
                Start-Service -Name $pgService.Name
                Write-Host "[OK] PostgreSQL service started`n" -ForegroundColor Green
            } catch {
                Write-Host "[!] Failed to start service. Try running as Administrator`n" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Ensure PostGIS extension is installed (via Stack Builder)" -ForegroundColor White
    Write-Host "2. Create database: psql -U postgres -c `"CREATE DATABASE chenda_db;`"" -ForegroundColor White
    Write-Host "3. Enable PostGIS: psql -U postgres -d chenda_db -c `"CREATE EXTENSION postgis;`"" -ForegroundColor White
    Write-Host "4. Update password in server/.env" -ForegroundColor White
    Write-Host "5. Run: start.bat`n" -ForegroundColor White
    
    exit 0
}

Write-Host "[!] PostgreSQL not found. Proceeding with installation...`n" -ForegroundColor Yellow

# Check if winget is available
if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host "[*] Windows Package Manager (winget) detected" -ForegroundColor Cyan
    Write-Host "[*] Installing PostgreSQL 15...`n" -ForegroundColor Cyan
    
    try {
        # Install PostgreSQL 15 (required version)
        winget install --id PostgreSQL.PostgreSQL.15 --silent --accept-package-agreements --accept-source-agreements
        
        Write-Host "`n[OK] PostgreSQL 15 installation completed!`n" -ForegroundColor Green
        Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
        Write-Host "=====================`n" -ForegroundColor Yellow
        
        Write-Host "1. Install PostGIS Extension:" -ForegroundColor White
        Write-Host "   - Open 'Stack Builder' from Start Menu" -ForegroundColor Gray
        Write-Host "   - Select PostgreSQL installation" -ForegroundColor Gray
        Write-Host "   - Navigate: Spatial Extensions -> PostGIS" -ForegroundColor Gray
        Write-Host "   - Complete installation`n" -ForegroundColor Gray
        
        Write-Host "2. Start PostgreSQL service:" -ForegroundColor White
        Write-Host "   Start-Service postgresql-x64-15`n" -ForegroundColor Gray
        
        Write-Host "3. Create Chenda database:" -ForegroundColor White
        Write-Host '   & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE chenda_db;"' -ForegroundColor Gray
        Write-Host '   & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"' -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "4. Configure Chenda:" -ForegroundColor White
        Write-Host "   - Edit server/.env" -ForegroundColor Gray
        Write-Host "   - Update DB_PASSWORD with your PostgreSQL password`n" -ForegroundColor Gray
        
        Write-Host "5. Start Chenda backend:" -ForegroundColor White
        Write-Host "   cd server" -ForegroundColor Gray
        Write-Host "   start.bat`n" -ForegroundColor Gray
        
        Write-Host "For detailed instructions, see: INSTALL_POSTGRESQL_WINDOWS.md`n" -ForegroundColor Cyan
        
    } catch {
        Write-Host "`n[X] Installation failed: $_`n" -ForegroundColor Red
        Write-Host "Please try manual installation:" -ForegroundColor Yellow
        Write-Host "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads`n" -ForegroundColor White
        exit 1
    }
    
} else {
    Write-Host "[!] Windows Package Manager (winget) not available" -ForegroundColor Yellow
    Write-Host "`nInstallation Options:`n" -ForegroundColor Cyan
    
    Write-Host "Option 1: Manual Download (Recommended)" -ForegroundColor White
    Write-Host "  1. Visit: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor Gray
    Write-Host "  2. Download PostgreSQL 15.x for Windows x86-64" -ForegroundColor Gray
    Write-Host "  3. Run installer and follow wizard" -ForegroundColor Gray
    Write-Host "  4. Use Stack Builder to install PostGIS extension`n" -ForegroundColor Gray
    
    Write-Host "Option 2: Chocolatey (if installed)" -ForegroundColor White
    Write-Host "  Run as Administrator:" -ForegroundColor Gray
    Write-Host "  choco install postgresql15 postgis`n" -ForegroundColor Gray
    
    Write-Host "Option 3: Enable winget (Windows 10 1809+)" -ForegroundColor White
    Write-Host "  1. Update Windows to latest version" -ForegroundColor Gray
    Write-Host "  2. Run this script again`n" -ForegroundColor Gray
    
    Write-Host "For detailed instructions, see: INSTALL_POSTGRESQL_WINDOWS.md`n" -ForegroundColor Cyan
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
