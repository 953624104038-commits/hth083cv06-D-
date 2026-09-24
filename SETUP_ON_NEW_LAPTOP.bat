@echo off
title VOXIS AI Bridge - One-Click Setup for New Laptop
echo ============================================================================
echo   VOXIS: Universal Sign Language Intelligence Bridge - Setup Installer
echo ============================================================================
echo.

echo [1/2] Installing Python Backend Dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Trying python -m pip install...
    python -m pip install -r requirements.txt
)

echo.
echo [2/2] Installing Frontend Node.js Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ============================================================================
echo   Setup Complete! You can now double-click START_VOXIS.bat to launch!
echo ============================================================================
pause
