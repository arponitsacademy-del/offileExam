# SmartOMR Local Development Setup Guide

Follow this guide to configure and run the complete SmartOMR application on your development workstation.

---

## 1. System Prerequisites

Ensure you have the following runtimes installed:
- **PHP:** `8.2` or higher with CLI extensions: `pdo`, `pdo_sqlite` (or `pdo_mysql`), `mbstring`, `openssl`, `fileinfo`, `curl`, `json`.
- **Composer:** `2.5` or higher.
- **Node.js:** `18.0` or higher (includes `npm`).
- **Python:** `3.10` or `3.11` (or use the portable embedded runtime in `python311/`).
- **Database:** SQLite (default for zero-configuration local dev) or MySQL 8.0+.

---

## 2. Directory Structure

```
offileExam/
├── backend/          # Laravel 12 REST API & Database
├── frontend/         # React 18 + Vite + Tailwind CSS SPA
├── omr-engine/       # Python FastAPI + OpenCV Computer Vision Service
├── python311/        # Portable Embedded Python 3.11 Runtime (Windows)
├── docs/             # Technical Architecture, MySQL DDL, API Specs
├── start-all.bat     # Windows 1-Click Launch Script
└── start-all.sh      # Linux/macOS Launch Script
```

---

## 3. Computer Vision Engine Setup (`omr-engine/`)

### Option A: Using the Bundled Portable Python (Windows)
No installation needed! The pre-configured portable Python 3.11 with OpenCV and FastAPI is located in `python311/`.

Test the engine test suite:
```powershell
cd omr-engine
..\python311\python.exe -m pytest -v
```

Start the FastAPI microservice daemon:
```powershell
cd omr-engine
..\python311\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
The microservice will be live at `http://127.0.0.1:8001`. You can open `http://127.0.0.1:8001/docs` in your browser to view the interactive Swagger UI.

### Option B: Using System Python (Linux / macOS / Windows)
```bash
cd omr-engine
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pytest -v
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

---

## 4. Backend Setup (`backend/`)

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Configure Environment Variables:**
   Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Verify the following critical settings in `backend/.env`:
   ```ini
   APP_NAME="SmartOMR"
   APP_ENV=local
   APP_KEY=base64:XQ9B8P2f...   # (Generate with: php artisan key:generate)
   APP_DEBUG=true
   APP_URL=http://localhost:8000

   # Database (Default is SQLite for zero-config; switch to mysql for production)
   DB_CONNECTION=sqlite
   # DB_CONNECTION=mysql
   # DB_HOST=127.0.0.1
   # DB_PORT=3306
   # DB_DATABASE=smartomr
   # DB_USERNAME=root
   # DB_PASSWORD=

   # OMR Computer Vision Microservice URL
   OMR_ENGINE_URL=http://127.0.0.1:8001
   OMR_ENGINE_API_KEY=smartomr_engine_internal_token_2026
   ```

3. **Install Dependencies (if not already installed):**
   ```bash
   composer install
   ```

4. **Initialize Database & Seed Demonstration Data:**
   ```bash
   php artisan migrate:fresh --seed
   ```
   This creates all 20 tables and seeds:
   - Super Admin account (`admin@smartomr.edu`)
   - Teacher account (`teacher@smartomr.edu`)
   - 5 Students with enrollment
   - Classes, Batches, Sections, and Subjects
   - 4 OMR template specifications (`omr_20_v1`, `omr_25_v1`, `omr_50_v1`, `omr_100_v1`)
   - Active examination `PHY-MID-2026` with complete 25-question Answer Key

5. **Create Storage Symbolic Link:**
   ```bash
   php artisan storage:link
   ```

6. **Run Backend Test Suite:**
   ```bash
   php artisan test
   ```
   All 9 tests will execute and pass, verifying Sanctum auth, RBAC policies, OMR calculation algorithms, duplicate submission safeguards, and end-to-end scanning.

7. **Start the Laravel API Server:**
   ```bash
   php artisan serve --port 8000
   ```
   The backend API will be available at `http://localhost:8000`.

---

## 5. Frontend Setup (`frontend/`)

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install Node Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Frontend Environment (`frontend/.env`):**
   ```ini
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Start Vite Development Server:**
   ```bash
   npm run dev
   ```
   The web application will open at `http://localhost:5173`.

5. **Verify Production Build:**
   ```bash
   npm run build
   ```
   Build artifacts will compile cleanly into `frontend/dist/`.

---

## 6. Demonstration Credentials

The database seeder pre-populates three ready-to-test accounts. In the web UI login screen (`http://localhost:5173/login`), you can click the quick-fill demo buttons or enter:

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Super Admin** | `admin@smartomr.edu` | `Password123!` | Full system access, teachers, students, exams, settings |
| **Teacher** | `teacher@smartomr.edu` | `Password123!` | Exam creation, answer keys, OMR sheet generation, mobile camera scanning, manual reviews, merit publication |
| **Student** | `amina.rahman@smartomr.edu` | `Password123!` | Student portal, inspect published examination scores and question breakdown |

---

## 7. Testing the Mobile Camera Scanner Workflow

1. Log in as **Teacher** (`teacher@smartomr.edu`).
2. Go to **Examinations** &rarr; Select `PHY-MID-2026` &rarr; Click **Generate OMR Sheets**.
3. Download or print the pre-allocated sheet for **Amina Rahman (Roll 101)**.
4. Click **Mobile Scanner** in the sidebar.
5. Select `Physics First Midterm Examination 2026` from the dropdown.
6. Grant camera permission. Point your camera at the printed sheet or synthetic test image, ensuring the four corner square fiducials align inside the reticle frame.
7. Click **Capture & Evaluate Sheet** (or click **Switch to File Upload** to upload an image from disk).
8. The system will detect answers, calculate score with negative penalties, verify against the answer key, and display the detailed results card with full question breakdown and the annotated visual overlay!

