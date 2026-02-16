#!/usr/bin/env pwsh
# Setup script for Task 2.3 (Buyer Dashboard)
# Run this from chenda-frontend directory

Write-Host "🚀 Setting up Buyer Dashboard components..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from chenda-frontend directory." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing required dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Ensure backend is running: cd ../server && npm run dev" -ForegroundColor White
Write-Host "  2. Start frontend dev server: npm run dev" -ForegroundColor White
Write-Host "  3. Open browser to: http://localhost:3000" -ForegroundColor White
Write-Host "  4. Login as a buyer account" -ForegroundColor White
Write-Host "  5. Test the search dashboard at /buyer" -ForegroundColor White
Write-Host ""
Write-Host "📁 Components created:" -ForegroundColor Yellow
Write-Host "  ✓ SearchForm.tsx (317 lines)" -ForegroundColor Green
Write-Host "  ✓ ProductCard.tsx (188 lines)" -ForegroundColor Green
Write-Host "  ✓ ProductGrid.tsx (75 lines)" -ForegroundColor Green
Write-Host "  ✓ ProductMap.tsx (81 lines)" -ForegroundColor Green
Write-Host "  ✓ ProductDetail.tsx (331 lines)" -ForegroundColor Green
Write-Host "  ✓ SortControls.tsx (93 lines)" -ForegroundColor Green
Write-Host "  ✓ searchStore.ts (169 lines)" -ForegroundColor Green
Write-Host "  ✓ cartStore.ts (110 lines)" -ForegroundColor Green
Write-Host "  ✓ (buyer)/page.tsx (213 lines)" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Documentation: docs/TASK_2.3_COMPLETE.md" -ForegroundColor Cyan
