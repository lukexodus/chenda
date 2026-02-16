# PostGIS Installation Script for PostgreSQL 15
# Must be run as Administrator
# This script downloads and installs PostGIS directly

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   PostGIS Installation for PostgreSQL 15" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

$pgPath = "C:\Program Files\PostgreSQL\15"
$tempDir = "$env:TEMP\postgis-install"
$downloadUrl = "https://download.osgeo.org/postgis/windows/pg15/postgis-bundle-pg15-3.4.2x64.zip"

# Create temp directory
Write-Host "[1/6] Preparing temporary directory..." -ForegroundColor Yellow
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "      Created: $tempDir" -ForegroundColor Gray
Write-Host ""

# Download PostGIS
Write-Host "[2/6] Downloading PostGIS bundle..." -ForegroundColor Yellow
Write-Host "      This may take a few minutes..." -ForegroundColor Gray
$zipFile = "$tempDir\postgis.zip"

try {
    # Use System.Net.WebClient for reliable download
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($downloadUrl, $zipFile)
    
    if (Test-Path $zipFile) {
        $fileSize = (Get-Item $zipFile).Length / 1MB
        Write-Host "      Downloaded: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    } else {
        throw "Download failed"
    }
} catch {
    Write-Host "      ERROR: Download failed" -ForegroundColor Red
    Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download manually from:" -ForegroundColor Yellow
    Write-Host "  $downloadUrl" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}
Write-Host ""

# Extract PostGIS
Write-Host "[3/6] Extracting PostGIS files..." -ForegroundColor Yellow
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipFile, $tempDir)
    Write-Host "      Extracted successfully" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Extraction failed" -ForegroundColor Red
    Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# Find postgis bundle directory
$bundleDir = Get-ChildItem -Path $tempDir -Directory | Where-Object { $_.Name -like "postgis-bundle*" } | Select-Object -First 1

if (-not $bundleDir) {
    Write-Host "ERROR: Could not find PostGIS bundle directory" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "      Found bundle: $($bundleDir.Name)" -ForegroundColor Gray
Write-Host ""

# Copy files to PostgreSQL directories
Write-Host "[4/6] Installing PostGIS files..." -ForegroundColor Yellow

# Copy bin files (DLLs)
Write-Host "      Copying binaries..." -ForegroundColor Gray
if (Test-Path "$($bundleDir.FullName)\bin") {
    Copy-Item "$($bundleDir.FullName)\bin\*" "$pgPath\bin\" -Force -Recurse
    Write-Host "      ✓ Binaries copied" -ForegroundColor Green
}

# Copy lib files
Write-Host "      Copying libraries..." -ForegroundColor Gray
if (Test-Path "$($bundleDir.FullName)\lib") {
    Copy-Item "$($bundleDir.FullName)\lib\*" "$pgPath\lib\" -Force -Recurse
    Write-Host "      ✓ Libraries copied" -ForegroundColor Green
}

# Copy share files (extensions, SQL scripts)
Write-Host "      Copying extensions..." -ForegroundColor Gray
if (Test-Path "$($bundleDir.FullName)\share\extension") {
    Copy-Item "$($bundleDir.FullName)\share\extension\*" "$pgPath\share\extension\" -Force -Recurse
    Write-Host "      ✓ Extensions copied" -ForegroundColor Green
}

# Copy contrib files
if (Test-Path "$($bundleDir.FullName)\share\contrib") {
    Copy-Item "$($bundleDir.FullName)\share\contrib\*" "$pgPath\share\contrib\" -Force -Recurse
    Write-Host "      ✓ Contrib files copied" -ForegroundColor Green
}

Write-Host ""

# Verify installation
Write-Host "[5/6] Verifying PostGIS installation..." -ForegroundColor Yellow
if (Test-Path "$pgPath\share\extension\postgis.control") {
    Write-Host "      ✓ postgis.control found" -ForegroundColor Green
} else {
    Write-Host "      ✗ postgis.control NOT found" -ForegroundColor Red
}

if (Test-Path "$pgPath\lib\postgis-3.dll") {
    Write-Host "      ✓ postgis-3.dll found" -ForegroundColor Green
} else {
    Write-Host "      ✗ postgis-3.dll NOT found" -ForegroundColor Red
}
Write-Host ""

# Enable PostGIS in chenda_db
Write-Host "[6/6] Enabling PostGIS in chenda_db..." -ForegroundColor Yellow

try {
    $result = & "$pgPath\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      ✓ PostGIS extension enabled!" -ForegroundColor Green
        Write-Host ""
        
        # Verify PostGIS version
        Write-Host "      Verifying installation..." -ForegroundColor Gray
        & "$pgPath\bin\psql.exe" -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
    } else {
        Write-Host "      ✗ Failed to enable extension" -ForegroundColor Red
        Write-Host "      $result" -ForegroundColor Red
    }
} catch {
    Write-Host "      ✗ Error enabling extension" -ForegroundColor Red
    Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Cleanup
Write-Host "Cleaning up temporary files..." -ForegroundColor Gray
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   PostGIS Installation Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Start the backend server" -ForegroundColor Yellow
Write-Host "  cd server" -ForegroundColor White
Write-Host "  start.bat" -ForegroundColor White
Write-Host ""

pause
