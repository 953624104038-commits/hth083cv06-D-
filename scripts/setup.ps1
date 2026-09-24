# HTH-CV-09 Environment Setup Script (Windows PowerShell)
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " HTH-CV-09 Environment Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Install Backend Dependencies
Write-Host "`n[1/3] Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install -r backend/requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing Python packages." -ForegroundColor Red
    exit 1
}

# 2. Verify / Download MediaPipe Task Model
Write-Host "`n[2/3] Verifying Google MediaPipe HandLandmarker task model..." -ForegroundColor Yellow
python -c "
import os, urllib.request
os.makedirs('models', exist_ok=True)
p = 'models/hand_landmarker.task'
if not os.path.exists(p):
    print('Downloading hand_landmarker.task...')
    urllib.request.urlretrieve('https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task', p)
    print('Downloaded!')
else:
    print('MediaPipe task model verified.')
"

# 3. Install Frontend Dependencies & Build
Write-Host "`n[3/3] Installing Node/Frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
Set-Location ..

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " Setup Complete! You can now run:" -ForegroundColor Green
Write-Host "   powershell scripts/run.ps1" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Green
