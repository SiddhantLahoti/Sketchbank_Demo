@echo off
echo [1/2] Building Vite React Frontend...
cd /d "%~dp0frontend"
call npm run build
if errorlevel 1 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo [2/2] Starting Jewelry OS Server on Port 8000...
cd /d "%~dp0backend"
call ..\venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8000
pause