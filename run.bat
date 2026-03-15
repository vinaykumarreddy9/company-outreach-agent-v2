@echo off
setlocal

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python and add it to your PATH.
    pause
    exit /b
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js.
    pause
    exit /b
)

echo.
echo [SYSTEM] INITIALIZING OUTREACH V3 PLATFORM...
echo [SYSTEM] MISSION CONTROL: STARTING ALL SUBSYSTEMS
echo.

:: Install backend dependencies if needed
pushd backend
if not exist venv (
    echo [BACKEND] Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo [BACKEND] Installing dependencies...
pip install -r requirements.txt
popd

:: Install frontend dependencies if needed
pushd frontend
if not exist node_modules (
    echo [FRONTEND] Installing node modules...
    npm install
)
popd

:: Launch Unified Backend (API + Workers + Sentinel)
echo [SUBSYSTEM] LAUNCHING UNIFIED BACKEND CLUSTER...
start "Backend Cluster" cmd /k "cd backend && call venv\Scripts\activate && python start_backend.py"

:: Launch Frontend
echo [SUBSYSTEM] LAUNCHING COMMAND INTERFACE...
start "Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo [SUCCESS] ALL SUBSYSTEMS ARE ONLINE.
echo [INFO] API: http://localhost:8000
echo [INFO] UI: http://localhost:5173
echo.
pause
