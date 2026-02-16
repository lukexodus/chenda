# Complete PostGIS Installation - Stop PostgreSQL, Copy Files, Restart
# Run as Administrator

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Complete PostGIS Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check admin
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    pause
    exit 1
}

$pgPath = "C:\Program Files\PostgreSQL\15"
$pgData = "$pgPath\data"

# Find PostGIS ZIP
Write-Host "Finding PostGIS ZIP file..." -ForegroundColor Gray
$zipFile = Get-ChildItem "$env:USERPROFILE\Downloads\postgis-bundle-pg15*.zip" | Select-Object -First 1

if (-not $zipFile) {
    Write-Host "ERROR: PostGIS ZIP not found in Downloads" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Found: $($zipFile.Name)" -ForegroundColor Green
Write-Host ""

# Stop PostgreSQL
Write-Host "Stopping PostgreSQL..." -ForegroundColor Yellow
$pgRunning = & "$pgPath\bin\pg_ctl.exe" status -D $pgData 2>&1

if ($pgRunning -match "server is running") {
    Write-Host "  Stopping server..." -ForegroundColor Gray
    & "$pgPath\bin\pg_ctl.exe" stop -D $pgData -m fast -w
    Start-Sleep -Seconds 2
    Write-Host "  PostgreSQL stopped" -ForegroundColor Green
} else {
    Write-Host "  PostgreSQL not running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Extracting PostGIS..." -ForegroundColor Yellow

$extractPath = "$env:TEMP\postgis-extract-final"
if (Test-Path $extractPath) {
    Remove-Item $extractPath -Recurse -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipFile.FullName, $extractPath)

$bundleDir = Get-ChildItem -Path $extractPath -Directory | Select-Object -First 1
if (-not $bundleDir -and (Test-Path "$extractPath\bin")) {
    $bundleDir = Get-Item $extractPath
}

Write-Host "Bundle: $($bundleDir.Name)" -ForegroundColor Gray
Write-Host ""
Write-Host "Copying ALL files to PostgreSQL..." -ForegroundColor Yellow

$success = $true

foreach ($dir in @("bin", "lib", "share")) {
    $sourcePath = Join-Path $bundleDir.FullName $dir
    $destPath = Join-Path $pgPath $dir
    
    if (Test-Path $sourcePath) {
        Write-Host "  $dir..." -NoNewline
        try {
            Copy-Item "$sourcePath\*" $destPath -Force -Recurse
            Write-Host " OK" -ForegroundColor Green
        } catch {
            Write-Host " FAILED: $($_.Exception.Message)" -ForegroundColor Red
            $success = $false
        }
    }
}

Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

if (-not $success) {
    Write-Host ""
    Write-Host "ERROR: File copy failed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
& "$pgPath\bin\pg_ctl.exe" start -D $pgData -w
Start-Sleep -Seconds 2

$pgStatus = & "$pgPath\bin\pg_ctl.exe" status -D $pgData 2>&1
if ($pgStatus -match "server is running") {
    Write-Host "  PostgreSQL started (PID: $($pgStatus -match 'PID: (\d+)'; $matches[1]))" -ForegroundColor Green
} else {
    Write-Host "  ERROR: PostgreSQL failed to start" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Enabling PostGIS extension..." -ForegroundColor Yellow
Write-Host ""

$output = & "$pgPath\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "PostGIS extension enabled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying version:" -ForegroundColor Gray
    & "$pgPath\bin\psql.exe" -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " PostGIS Installation COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "PostgreSQL is running and ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Start the backend server" -ForegroundColor Yellow
    Write-Host "  cd server" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
} else {
    Write-Host "ERROR enabling extension:" -ForegroundColor Red
    Write-Host $output -ForegroundColor Red
}

Write-Host ""
pause
