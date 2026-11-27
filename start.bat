@echo off
setlocal
set "ROOT_DIR=%~dp0"
set "PATH=%ROOT_DIR%node-embed;%ROOT_DIR%python-embed;%ROOT_DIR%python-embed\Scripts;%PATH%"

echo [1/2] Building Vite React Frontend...
cd /d "%ROOT_DIR%frontend"
call "%ROOT_DIR%node-embed\npm.cmd" run build
if errorlevel 1 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo [2/2] Starting Jewelry OS Server on Port 8000...
cd /d "%ROOT_DIR%backend"
"%ROOT_DIR%python-embed\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause