# HTH-CV-09 One-Command Full Stack Launcher (Windows PowerShell)
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Launching HTH-CV-09 Sign Language Communication Bridge" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if model exists
if (-not (Test-Path "models/best_model.pkl")) {
    Write-Host "Model not detected. Training baseline model first..." -ForegroundColor Yellow
    python training/train.py
}

# Start Backend in Background
Write-Host "`nStarting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
$backendJob = Start-Process python -ArgumentList "-m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000" -PassThru -NoNewWindow

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "`nStarting React Frontend on http://localhost:5173..." -ForegroundColor Yellow
Set-Location frontend
$frontendJob = Start-Process npm -ArgumentList "run dev" -PassThru -NoNewWindow
Set-Location ..

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " Application is running!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Health:   http://localhost:8000/health" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C or close this window to stop both servers.`n" -ForegroundColor Gray

# Wait for process exit
try {
    Wait-Process -Id $backendJob.Id, $frontendJob.Id
} finally {
    Stop-Process -Id $backendJob.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendJob.Id -ErrorAction SilentlyContinue
}
