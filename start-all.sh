#!/usr/bin/env bash

# =====================================================================
# SmartOMR - Unified Dev Environment Launcher (Linux / macOS)
# =====================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "====================================================================="
echo " Starting SmartOMR - Automated OMR Examination System"
echo "====================================================================="
echo ""

# 1. Start Python OMR Microservice
echo "[1/3] Launching Python FastAPI OMR Microservice (Port 8001)..."
cd "$ROOT_DIR/omr-engine"
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload > /dev/null 2>&1 &
OMR_PID=$!

# 2. Start Laravel API
echo "[2/3] Launching Laravel REST API Backend (Port 8000)..."
cd "$ROOT_DIR/backend"
php artisan serve --port 8000 > /dev/null 2>&1 &
LARAVEL_PID=$!

# 3. Start React Vite Frontend
echo "[3/3] Launching React Vite Frontend (Port 5173)..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "====================================================================="
echo " All services running:"
echo "   - Python OMR Engine: http://127.0.0.1:8001 (PID $OMR_PID)"
echo "   - Laravel Backend:   http://127.0.0.1:8000 (PID $LARAVEL_PID)"
echo "   - Frontend UI:       http://localhost:5173 (PID $FRONTEND_PID)"
echo ""
echo " Demo Logins:"
echo "   - Super Admin: admin@smartomr.edu   / Password123!"
echo "   - Teacher:     teacher@smartomr.edu / Password123!"
echo "   - Student:     amina.rahman@smartomr.edu / Password123!"
echo ""
echo " Press Ctrl+C to terminate all services."
echo "====================================================================="

cleanup() {
    echo ""
    echo "Shutting down SmartOMR services..."
    kill $OMR_PID $LARAVEL_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

wait

