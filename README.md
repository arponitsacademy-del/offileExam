# SmartOMR — Automated OMR Examination & Evaluation System

SmartOMR is a complete, production-ready optical mark recognition (OMR) examination platform. It transforms standard smartphone cameras into automated examination grading stations with perspective-warped computer vision, negative marking evaluation, audit-controlled manual reviews, and real-time merit rank publication.

---

## Key Features

1. **Mobile-First Browser Camera Scanner:**
   - Real-time video preview using HTML5 W3C `navigator.mediaDevices.getUserMedia` with rear camera preference (`facingMode: { ideal: "environment" }`).
   - Dynamic alignment reticle with live capture, snapshot review, retake, and fallback file upload.
   - Sub-pixel perspective correction via 4 high-contrast fiducial corner markers.
2. **Computer Vision Recognition Engine:**
   - Microservice built with **Python 3.11, FastAPI, OpenCV, and NumPy**.
   - Automated 4-point projective homography transformation to canonical $1200 \times 1697$ resolution.
   - Built-in OpenCV QR code decoder for instant student and examination mapping without exposing raw PII.
   - Bubble fill density ratio analyzer ($\ge 0.42$ filled, $\le 0.22$ blank).
   - Instant detection and flagging of multiple markings and uncertain/smudged bubbles.
   - High-resolution annotated visual color overlay generation (Base64 JPEG).
   - Direct CLI execution fallback (`app/engine/cli.py`) ensuring zero downtime even if the FastAPI daemon is offline.
3. **Enterprise Laravel 12 Backend:**
   - REST API with **Laravel Sanctum** token-based authentication and Role-Based Access Control (RBAC).
   - Version-controlled Answer Key manager with automatic result recalculation.
   - Negative marking penalty engine and tie-breaker merit ranking.
   - Duplicate submission protection with confirmation override dialogs.
   - Comprehensive audit logging and system setting management.
4. **Modern React 18 SaaS Dashboard:**
   - Built with **React 18, Vite, Tailwind CSS, Lucide React, and Recharts**.
   - Light and Dark mode with responsive mobile sidebar and navigation.
   - Interactive KPI cards, score distribution bar charts, and pass/fail donut analytics.
   - A4 printable OMR sheet generator with standardized coordinates and corner fiducials.
   - Split-screen Manual Review UI displaying original photo vs annotated overlay with per-question override tools.
   - Dedicated Student Portal for self-service score inspection and answer breakdowns.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM 6, Axios, Lucide React, Recharts |
| **Backend API** | PHP 8.2+, Laravel 12, Laravel Sanctum, Barryvdh DomPDF |
| **Vision Microservice** | Python 3.11, FastAPI, OpenCV Headless 5.x, NumPy, Uvicorn, Pillow, Pytest |
| **Database** | MySQL 8.0+ / SQLite (Pre-configured for both) |
| **Mobile Integration** | HTML5 W3C MediaDevices Camera API, Canvas 2D image capture |

---

## System Architecture

```
React Frontend (Vite / Port 5173)
       │
       ▼
Laravel REST API (Port 8000) ──────► MySQL 8 Database (20+ Tables)
       │
       ▼
Python FastAPI OMR Service (Port 8001) / CLI Fallback
       │
       ▼
OpenCV 4-Point Homography & Bubble Density Analyzer
       │
       ▼
Detected Answers & Annotated Color Overlay
       │
       ▼
Laravel Result Evaluation & Merit Rank Calculation
```

For complete technical specifications, mathematical models, and sequence diagrams, refer to [ARCHITECTURE.md](file:///D:/clientProject/offileExam/docs/ARCHITECTURE.md).

---

## Project Structure

```
offileExam/
├── backend/                  # Laravel 12 API Application
│   ├── app/
│   │   ├── Http/Controllers/Api/  # 11 REST API Controllers (59 Endpoints)
│   │   ├── Http/Middleware/       # CheckRole RBAC Middleware
│   │   ├── Models/                # 20 Eloquent Models with Relationships
│   │   └── Services/              # OmrEvaluationService
│   ├── database/migrations/       # 20 Database Tables Migration
│   ├── database/seeders/          # DatabaseSeeder (Admin, Teacher, Students, Exam, Keys)
│   ├── tests/Feature/             # PHPUnit Automated Test Suites
│   └── routes/api.php             # REST Route Registrations
├── frontend/                 # React 18 + Vite Application
│   ├── src/
│   │   ├── api/client.js          # Axios Client with Bearer Token Interceptor
│   │   ├── components/            # CameraScanner, OmrPrintableSheet, Layout, UI Shell
│   │   ├── context/               # AuthContext, ThemeContext (Light/Dark)
│   │   ├── pages/                 # Dashboard, Scanner, Review, Exams, Merit, Students
│   │   └── App.jsx                # Protected Route Graph
│   └── package.json
├── omr-engine/               # Python OMR Computer Vision Microservice
│   ├── app/
│   │   ├── config.py              # Geometric & Density Thresholds
│   │   ├── main.py                # FastAPI HTTP REST API
│   │   └── engine/
│   │       ├── templates.py       # Normalized Coordinate Layouts (20, 25, 50, 100 Q)
│   │       ├── preprocessor.py    # Fiducials, 4-Point Warp & QR Code Detection
│   │       ├── detector.py        # Bubble Density Evaluator & Annotated Overlay
│   │       └── cli.py             # Direct Command-Line Fallback Tool
│   ├── tests/test_omr.py          # Pytest Automated Test Suite
│   └── requirements.txt
├── python311/                # Portable Embedded Python 3.11 Runtime (Windows)
├── docs/                     # Full Engineering Documentation
│   ├── ARCHITECTURE.md            # Technical Architecture & Math Model
│   ├── API_DOCUMENTATION.md       # OpenAPI/Swagger Endpoints Reference
│   ├── smartomr_mysql_schema.sql  # Production MySQL 8.0 DDL & Seeds
│   ├── SETUP_INSTRUCTIONS.md      # Local Workstation Setup Guide
│   └── DEPLOYMENT_INSTRUCTIONS.md # Production Nginx/HTTPS/Systemd Guide
├── start-all.bat             # 1-Click Windows Launcher
└── start-all.sh              # 1-Click Linux/macOS Launcher
```

---

## Quick Start (Local Workstation)

### 1-Click Launchers

- **Windows:** Double-click `start-all.bat` (or run `./start-all.bat` in Command Prompt).
- **Linux / macOS:** Run `chmod +x start-all.sh && ./start-all.sh`.

### Manual Startup

1. **OMR Vision Engine (Port 8001):**
   ```bash
   cd omr-engine
   uvicorn app.main:app --port 8001 --reload
   ```
2. **Laravel Backend API (Port 8000):**
   ```bash
   cd backend
   php artisan serve --port 8000
   ```
3. **React Frontend UI (Port 5173):**
   ```bash
   cd frontend
   npm run dev
   ```

Open your browser at `http://localhost:5173`.

---

## Demonstration Credentials

The application includes pre-seeded demonstration accounts:

| Role | Email Address | Password | Capabilities |
|---|---|---|---|
| **Super Admin** | `admin@smartomr.edu` | `Password123!` | Complete administrative control, teachers, classes, system settings |
| **Teacher** | `teacher@smartomr.edu` | `Password123!` | Exam creation, answer key editing, OMR sheet generation, camera scanner, review, merit list |
| **Student** | `amina.rahman@smartomr.edu` | `Password123!` | Student portal, review published results and question-by-question breakdown |

---

## Automated Verification & Test Results

### Backend PHPUnit Test Suite
```
PASS  Tests\Unit\ExampleTest
PASS  Tests\Feature\ExampleTest
PASS  Tests\Feature\OmrEndToEndScanTest
  ✓ complete omr scanning and evaluation pipeline
PASS  Tests\Feature\OmrSystemTest
  ✓ user can login and receive sanctum token
  ✓ student cannot access teacher endpoints
  ✓ teacher can fetch answer key
  ✓ omr evaluation service calculates scores and negative marking
  ✓ duplicate submission throws exception unless confirmed
  ✓ student only sees published results

Tests: 9 passed (34 assertions)
```

### Python Computer Vision Test Suite
```
tests/test_omr.py::test_bubble_detection PASSED                          [ 20%]
tests/test_omr.py::test_blank_detection PASSED                           [ 40%]
tests/test_omr.py::test_multiple_marks_detection PASSED                  [ 60%]
tests/test_omr.py::test_uncertain_marks_detection PASSED                 [ 80%]
tests/test_omr.py::test_alignment_correction PASSED                      [100%]

5 passed in 0.29s
```

### Frontend Production Build
```
vite v6.4.6 building for production...
✓ 2093 modules transformed.
dist/index.html                   0.98 kB
dist/assets/index-DjK5Y2sP.css   45.72 kB
dist/assets/index-BCZVRCXR.js   848.43 kB
✓ built in 6.30s
```

---

## Documentation Links

- [Architecture & Mathematical Model](file:///D:/clientProject/offileExam/docs/ARCHITECTURE.md)
- [REST API Reference](file:///D:/clientProject/offileExam/docs/API_DOCUMENTATION.md)
- [Production MySQL 8.0 Schema DDL](file:///D:/clientProject/offileExam/docs/smartomr_mysql_schema.sql)
- [Local Setup Guide](file:///D:/clientProject/offileExam/docs/SETUP_INSTRUCTIONS.md)
- [Production Deployment Guide](file:///D:/clientProject/offileExam/docs/DEPLOYMENT_INSTRUCTIONS.md)

---

## License

Proprietary enterprise educational software developed for automated examination evaluation.

