# PostGIS Manual Installation Guide
# Follow these steps to install PostGIS for PostgreSQL 15

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   PostGIS Installation Guide" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Download PostGIS" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Open your browser and go to:" -ForegroundColor White
Write-Host "  https://download.osgeo.org/postgis/windows/pg15/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Download ONE of these files:" -ForegroundColor White
Write-Host "  • postgis-bundle-pg15-3.4.2x64.zip" -ForegroundColor Green
Write-Host "  • postgis-bundle-pg15-3.3.5x64.zip" -ForegroundColor Green  
Write-Host "  • Any postgis-bundle-pg15-*.zip file" -ForegroundColor Green
Write-Host ""
Write-Host "Save it to your Downloads folder" -ForegroundColor White
Write-Host ""

$downloaded = Read-Host "Have you downloaded the file? (y/n)"

if ($downloaded -ne 'y') {
    Write-Host ""
    Write-Host "Please download the file first, then run this script again" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "STEP 2: Locate the Downloaded File" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Try to find the file in common locations
$searchPaths = @(
    "$env:USERPROFILE\Downloads",
    "$env:USERPROFILE\Desktop",
    "C:\Users\$env:USERNAME\Downloads"
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

if ($foundFiles.Count -gt 0) {
    Write-Host "Found PostGIS file(s):" -ForegroundColor Green
    for ($i = 0; $i -lt $foundFiles.Count; $i++) {
        Write-Host "  [$($i+1)] $($foundFiles[$i].FullName)" -ForegroundColor White
    }
    Write-Host ""
    
    if ($foundFiles.Count -eq 1) {
        $zipFile = $foundFiles[0].FullName
        Write-Host "Using: $zipFile" -ForegroundColor Green
    } else {
        $selection = Read-Host "Select file number (1-$($foundFiles.Count))"
        $zipFile = $foundFiles[[int]$selection - 1].FullName
    }
} else {
    Write-Host "Could not find PostGIS zip file automatically" -ForegroundColor Yellow
    Write-Host ""
    $zipFile = Read-Host "Enter full path to the PostGIS zip file"
    
    if (-not (Test-Path $zipFile)) {
        Write-Host ""
        Write-Host "ERROR: File not found: $zipFile" -ForegroundColor Red
        Write-Host ""
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "STEP 3: Extract PostGIS" -ForegroundColor Yellow  
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

$extractPath = "$env:TEMP\postgis-extract"

if (Test-Path $extractPath) {
    Remove-Item $extractPath -Recurse -Force
}

Write-Host "Extracting to: $extractPath" -ForegroundColor Gray
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipFile, $extractPath)
    Write-Host "✓ Extraction complete" -ForegroundColor Green
} catch {
    Write-Host "✗ Extraction failed: $($_.Exception.Message)" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "STEP 4: Copy Files to PostgreSQL" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Check if running as admin
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Administrator privileges required!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Close this window" -ForegroundColor White
    Write-Host "  2. Right-click PowerShell" -ForegroundColor White
    Write-Host "  3. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "  4. Run this script again" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

$pgPath = "C:\Program Files\PostgreSQL\15"
$bundleDir = Get-ChildItem -Path $extractPath -Directory | Select-Object -First 1

if (-not $bundleDir) {
    Write-Host "ERROR: Could not find extracted bundle directory" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Copying files from: $($bundleDir.Name)" -ForegroundColor Gray
Write-Host ""

# Copy each directory
$dirsToCopy = @("bin", "lib", "share")

foreach ($dir in $dirsToCopy) {
    $sourcePath = Join-Path $bundleDir.FullName $dir
    $destPath = Join-Path $pgPath $dir
    
    if (Test-Path $sourcePath) {
        Write-Host "  Copying $dir..." -ForegroundColor Gray
        try {
            Copy-Item "$sourcePath\*" $destPath -Force -Recurse -ErrorAction Stop
            Write-Host "  ✓ $dir copied" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Failed to copy $dir : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "STEP 5: Verify Installation" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

if (Test-Path "$pgPath\share\extension\postgis.control") {
    Write-Host "✓ postgis.control found" -ForegroundColor Green
} else {
    Write-Host "✗ postgis.control NOT found" -ForegroundColor Red
}

if (Test-Path "$pgPath\lib\postgis-3.dll") {
    Write-Host "✓ postgis-3.dll found" -ForegroundColor Green
} else {
    Write-Host "✗ postgis-3.dll NOT found" -ForegroundColor Red  
}

Write-Host ""
Write-Host "STEP 6: Enable PostGIS Extension" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

$result = & "$pgPath\bin\psql.exe" -U postgres -d chenda_db -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostGIS extension enabled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying PostGIS version:" -ForegroundColor Gray
    & "$pgPath\bin\psql.exe" -U postgres -d chenda_db -c "SELECT PostGIS_Version();"
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "   PostGIS Installation SUCCESS!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to enable extension" -ForegroundColor Red
    Write-Host "$result" -ForegroundColor Red
}

# Cleanup
Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Next: Start the backend server" -ForegroundColor Yellow
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

pause
