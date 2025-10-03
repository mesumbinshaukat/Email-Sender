# Force Vercel Deployment with Cache Clear (PowerShell)
# This script forces a fresh deployment without using cached builds

Write-Host "🚀 Force deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Navigate to backend
Set-Location -Path "backend"

Write-Host "📦 Deploying backend with --force flag..." -ForegroundColor Yellow
vercel --prod --force

Write-Host ""
Write-Host "✅ Deployment triggered!" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Please wait 1-2 minutes for deployment to complete" -ForegroundColor Yellow
Write-Host "📊 Check status at: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 After deployment, verify the fix:" -ForegroundColor Magenta
Write-Host "   - No more 'email_scheduling is not a valid enum' errors"
Write-Host "   - Scheduler endpoints should work correctly"

# Return to root
Set-Location -Path ".."
