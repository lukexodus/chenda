# Chenda Backend Setup & Start Script for Windows
# Run this script from PowerShell in the server directory
# Usage: .\start.ps1

Write-Host "🚀 Chenda Backend Setup & Start" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Ensure we're in the server directory
$serverPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $serverPath

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Creating default .env file..." -ForegroundColor Yellow
    
    @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chenda_db
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3001
NODE_ENV=development

# Session Configuration
SESSION_SECRET=chenda-super-secret-key-change-this-in-production-2026

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
"@ | Out-File -FilePath ".env" -Encoding utf8
    
    Write-Host "✅ Created .env file with default settings" -ForegroundColor Green
    Write-Host "   ⚠️  Please update DB_PASSWORD if needed!" -ForegroundColor Yellow
    Write-Host ""
}

# Check if PostgreSQL service is running
Write-Host "🔍 Checking PostgreSQL service..." -ForegroundColor Cyan
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($null -eq $pgService) {
    Write-Host "❌ PostgreSQL service not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Install PostgreSQL 15+ with PostGIS extension" -ForegroundColor White
    Write-Host "  3. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

if ($pgService.Status -ne "Running") {
    Write-Host "⚠️  PostgreSQL service is not running!" -ForegroundColor Yellow
    Write-Host "   Attempting to start PostgreSQL service..." -ForegroundColor Cyan
    
    try {
        Start-Service -Name $pgService.Name -ErrorAction Stop
        Write-Host "✅ PostgreSQL service started successfully!" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } catch {
        Write-Host "❌ Failed to start PostgreSQL service!" -ForegroundColor Red
        Write-Host "   Please start it manually:" -ForegroundColor Yellow
        Write-Host "   1. Open Services (services.msc)" -ForegroundColor White
        Write-Host "   2. Find '$($pgService.Name)'" -ForegroundColor White
        Write-Host "   3. Right-click → Start" -ForegroundColor White
        Write-Host ""
        Write-Host "   Or run as Administrator:" -ForegroundColor Yellow
        Write-Host "   net start $($pgService.Name)" -ForegroundColor White
        Write-Host ""
        exit 1
    }
} else {
    Write-Host "✅ PostgreSQL service is running" -ForegroundColor Green
}

Write-Host ""

# Test database connection
Write-Host "📡 Testing database connection..." -ForegroundColor Cyan
$testResult = node ..\migrations\test-connection.js 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Cannot connect to PostgreSQL database!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL service is running (check above)" -ForegroundColor White
    Write-Host "  2. Database credentials in .env are correct" -ForegroundColor White
    Write-Host "  3. Database chenda_db exists" -ForegroundColor White
    Write-Host ""
    Write-Host "To create the database:" -ForegroundColor Yellow
    Write-Host '  psql -U postgres -c "CREATE DATABASE chenda_db;"' -ForegroundColor White
    Write-Host '  psql -U postgres -d chenda_db -c "CREATE EXTENSION postgis;"' -ForegroundColor White
    Write-Host ""
    Write-Host "If you get a password error, update DB_PASSWORD in .env" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Database connection successful!" -ForegroundColor Green
Write-Host ""

# Run migrations
Write-Host "🔧 Running database migrations..." -ForegroundColor Cyan
node ..\migrations\migrate.js up

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
Write-Host ""

# Seed database
Write-Host "🌱 Seeding database with test data..." -ForegroundColor Cyan
Set-Location ..\seeds
node seed.js
Set-Location ..\server

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Seeding completed with warnings (may already be seeded)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Starting backend server..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Start the server
npm run dev
