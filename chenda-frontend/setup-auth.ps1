# Quick Setup Script for Task 2.2

Write-Host "🚀 Setting up Chenda Frontend Authentication..." -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
$frontendPath = "c:\Users\ACER\Documents\CHENDA\chenda\chenda-frontend"
Set-Location $frontendPath

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "✅ Installing Radix UI dependencies for radio-group and checkbox..." -ForegroundColor Yellow
npm install @radix-ui/react-radio-group @radix-ui/react-checkbox

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the backend: cd ..\server && npm start" -ForegroundColor White
Write-Host "2. Start the frontend: npm run dev" -ForegroundColor White
Write-Host "3. Open http://localhost:3000/register" -ForegroundColor White
Write-Host ""
Write-Host "📚 See TASK_2.2_AUTH_GUIDE.md for testing instructions" -ForegroundColor Cyan
