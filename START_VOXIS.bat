@echo off
title VOXIS AI Bridge - Launcher
echo ============================================================================
echo   Starting VOXIS Universal Sign Language AI Bridge (Backend + Frontend)
echo ============================================================================
echo.

set PY_CMD=py -3.13
if exist ".venv\Scripts\python.exe" (
    set PY_CMD=".venv\Scripts\python.exe"
) else if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set PY_CMD="%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
) else if exist "..\Sign-Language-to-Speech-main\.venv\Scripts\python.exe" (
    set PY_CMD="..\Sign-Language-to-Speech-main\.venv\Scripts\python.exe"
)

REM Start Backend FastAPI Server on Port 8000
start "VOXIS Backend Engine (Port 8000)" cmd /k "%PY_CMD% -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak >nul

REM Start Frontend Vite Server on Port 5173
start "VOXIS Frontend UI (Port 5173)" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0 --port 5173"

REM Wait 3 seconds and open browser automatically
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Both Backend (http://127.0.0.1:8000) and Frontend (http://localhost:5173) are starting!
echo Your browser will open automatically.
