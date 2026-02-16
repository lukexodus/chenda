# PostGIS Installer for PostgreSQL 15
# Run as Administrator

param(
    [string]$ZipFile = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PostGIS Installation for PostgreSQL 15" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check admin
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

$pgPath = "C:\Program Files\PostgreSQL\15"

if (-not (Test-Path $pgPath)) {
    Write-Host "ERROR: PostgreSQL 15 not found at $pgPath" -ForegroundColor Red
    pause
    exit 1
}

# Find or specify ZIP file
if ($ZipFile -eq "") {
    Write-Host "Searching for PostGIS ZIP file..." -ForegroundColor Gray
    
    $searchPaths = @(
        "$env:USERPROFILE\Downloads",
        "$env:USERPROFILE\Desktop"
    )
    
    $foundFiles = @()
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            $files = Get-ChildItem -Path $path -Filter "postgis-bundle-pg15*.zip" -ErrorAction SilentlyContinue
            if ($files) {
                $foundFiles += $files
            }
        }
    }
    
    if ($foundFiles.Count -eq 0) {
        Write-Host ""
        Write-Host "No PostGIS ZIP file found!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please download from:" -ForegroundColor White
        Write-Host "  https://download.osgeo.org/postgis/windows/pg15/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Download: postgis-bundle-pg15-3.4.2x64.zip" -ForegroundColor Green
        Write-Host "Save to your Downloads folder" -ForegroundColor White
        Write-Host ""
        pause
        exit 1
    }
    
    if ($foundFiles.Count -eq 1) {
        $ZipFile = $foundFiles[0].FullName
        Write-Host "Found: $ZipFile" -ForegroundColor Green
    } else {
        Write-Host "Found multiple files:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $foundFiles.Count; $i++) {
            Write-Host "  [$($i+1)] $($foundFiles[$i].Name)" -ForegroundColor White
        }
        $selection = Read-Host "Select file (1-$($foundFiles.Count))"
        $ZipFile = $foundFiles[[int]$selection - 1].FullName
    }
}

if (-not (Test-Path $ZipFile)) {
    Write-Host "ERROR: File not found: $ZipFile" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Extracting PostGIS..." -ForegroundColor Yellow

$extractPath = "$env:TEMP\postgis-extract-$(Get-Date -Format 'yyyyMMddHHmmss')"

try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipFile, $extractPath)
    Write-Host "Extracted to: $extractPath" -ForegroundColor Gray
} catch {
    Write-Host "ERROR extracting ZIP: $($_.Exception.Message)" -ForegroundColor Red
    pause
    exit 1
}

# Find the bundle directory
$bundleDir = Get-ChildItem -Path $extractPath -Directory | Select-Object -First 1

if (-not $bundleDir) {
    # Check if files are in root
    if (Test-Path "$extractPath\bin") {
        $bundleDir = Get-Item $extractPath
    } else {
        Write-Host "ERROR: Cannot find bundle directory" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host "Bundle directory: $($bundleDir.Name)" -ForegroundColor Gray
Write-Host ""
Write-Host "Copying files to PostgreSQL..." -ForegroundColor Yellow

# Copy directories
$copied = 0
$failed = 0

foreach ($dir in @("bin", "lib", "share")) {
    $sourcePath = Join-Path $bundleDir.FullName $dir
    $destPath = Join-Path $pgPath $dir
    
    if (Test-Path $sourcePath) {
        Write-Host "  $dir..." -NoNewline
        try {
            Copy-Item "$sourcePath\*" $destPath -Force -Recurse
            Write-Host " OK" -ForegroundColor Green
            $copied++
        } catch {
            Write-Host " FAILED" -ForegroundColor Red
            Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "  $dir... SKIPPED (not found in bundle)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow

$controlFile = "$pgPath\share\extension\postgis.control"
$dllFile = "$pgPath\lib\postgis-3.dll"

if (Test-Path $controlFile) {
    Write-Host "  postgis.control... OK" -ForegroundColor Green
} else {
    Write-Host "  postgis.control... MISSING" -ForegroundColor Red
    $failed++
}

if (Test-Path $dllFile) {
    Write-Host "  postgis-3.dll... OK" -ForegroundColor Green
} else {
    Write-Host "  postgis-3.dll... MISSING" -ForegroundColor Red
    $failed++
}

# Cleanup
Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""

if ($failed -gt 0) {
    Write-Host "Installation FAILED - $failed error(s)" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Enabling PostGIS extension..." -ForegroundColor Yellow
Write-Host ""

$psqlPath = "$pgPath\bin\psql.exe"
$createCmd = "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"

try {
    $output = & $psqlPath -U postgres -d chenda_db -c $createCmd 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostGIS extension enabled!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Checking version:" -ForegroundColor Gray
        & $psqlPath -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host " PostGIS Installation COMPLETE!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next step: Start the backend server" -ForegroundColor Yellow
        Write-Host "  cd server" -ForegroundColor White
        Write-Host "  npm run dev" -ForegroundColor White
    } else {
        Write-Host "Failed to enable extension" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
pause
