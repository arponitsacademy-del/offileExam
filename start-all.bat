@echo off
TITLE SmartOMR - Unified Dev Environment Launcher
echo =====================================================================
echo  Starting SmartOMR - Automated OMR Examination System
echo =====================================================================
echo.

set ROOT_DIR=%~dp0
set PYTHON_EXE=%ROOT_DIR%python311\python.exe

if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

echo [1/3] Launching Python FastAPI OMR Microservice (Port 8001)...
start "SmartOMR Vision Engine (Port 8001)" cmd /k "cd /d %ROOT_DIR%omr-engine && "%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

echo [2/3] Launching Laravel REST API Backend (Port 8000)...
start "SmartOMR Laravel API (Port 8000)" cmd /k "cd /d %ROOT_DIR%backend && php artisan serve --port 8000"

echo [3/3] Launching React Vite Frontend (Port 5173)...
start "SmartOMR React Frontend (Port 5173)" cmd /k "cd /d %ROOT_DIR%frontend && npm run dev"

echo.
echo =====================================================================
echo  All 3 tiers have been started in separate terminals:
echo    - Vision Engine: http://127.0.0.1:8001/docs
echo    - Backend API:   http://127.0.0.1:8000/api
echo    - Frontend App:  http://localhost:5173
echo.
echo  Default Demo Logins:
echo    - Super Admin: admin@smartomr.edu   / Password123!
echo    - Teacher:     teacher@smartomr.edu / Password123!
echo    - Student:     amina.rahman@smartomr.edu / Password123!
echo =====================================================================
pause

