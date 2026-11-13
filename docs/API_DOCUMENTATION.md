# SmartOMR REST API Specification

Comprehensive documentation for the SmartOMR REST API endpoints.

- **Base URL:** `http://localhost:8000/api`
- **Authentication:** Bearer Token via Laravel Sanctum (`Authorization: Bearer <token>`)
- **Headers:**
  - `Accept: application/json`
  - `Content-Type: application/json` (or `multipart/form-data` for file uploads)

---

## 1. Authentication & Profile Endpoints

### 1.1. Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "teacher@smartomr.edu",
  "password": "Password123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "1|QW82X...sanctum_token...",
  "user": {
    "id": 2,
    "name": "Prof. Alex Mercer",
    "email": "teacher@smartomr.edu",
    "role": "teacher",
    "status": "active"
  }
}
```
- **Error Responses:** `401 Unauthorized` (Invalid credentials), `422 Unprocessable Content` (Validation errors).

### 1.2. Get Current Authenticated User
- **Endpoint:** `GET /api/auth/me`
- **Access:** Authenticated (Any role)
- **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "name": "Prof. Alex Mercer",
    "email": "teacher@smartomr.edu",
    "role": "teacher",
    "teacher_profile": {
      "id": 1,
      "employee_id": "TCH-1001",
      "designation": "Senior Physics Lecturer",
      "department": "Department of Natural Sciences"
    }
  }
}
```

### 1.3. Update Profile
- **Endpoint:** `PUT /api/auth/profile`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "name": "Prof. Alex Mercer, Ph.D.",
  "phone": "+1-555-0199"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": { ... }
}
```

### 1.4. Change Password
- **Endpoint:** `PUT /api/auth/change-password`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "current_password": "Password123!",
  "new_password": "NewSecurePassword456!",
  "new_password_confirmation": "NewSecurePassword456!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

### 1.5. Logout
- **Endpoint:** `POST /api/auth/logout`
- **Access:** Authenticated
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

## 2. Dashboard Analytics

### 2.1. Get Executive Dashboard KPI Stats
- **Endpoint:** `GET /api/dashboard/stats`
- **Access:** Teacher, Super Admin
- **Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total_students": 5,
    "total_teachers": 1,
    "total_exams": 1,
    "total_scanned_sheets": 12,
    "total_published_results": 10,
    "average_score": 78.4,
    "pass_percentage": 85.0
  },
  "score_distribution": [
    { "range": "0-19%", "count": 0 },
    { "range": "20-39%", "count": 1 },
    { "range": "40-59%", "count": 2 },
    { "range": "60-79%", "count": 4 },
    { "range": "80-100%", "count": 5 }
  ],
  "pass_fail_comparison": [
    { "name": "Passed", "value": 10 },
    { "name": "Failed", "value": 2 }
  ],
  "recent_exams": [ ... ],
  "recent_scans": [ ... ]
}
```

---

## 3. Examination Management

### 3.1. List Examinations
- **Endpoint:** `GET /api/exams`
- **Access:** Teacher, Super Admin
- **Query Params:** `search`, `status`, `class_id`, `per_page`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "exam_code": "PHY-MID-2026",
      "title": "Physics First Midterm Examination 2026",
      "subject": { "id": 1, "name": "Physics Paper 1", "code": "PHY-101" },
      "class": { "id": 1, "name": "Higher Secondary Class XII" },
      "template": { "id": 2, "code": "omr_25_v1", "name": "Standard 25-MCQ A4" },
      "exam_date": "2026-11-20",
      "duration_minutes": 45,
      "total_questions": 25,
      "marks_per_question": "1.00",
      "negative_marks_per_question": "0.25",
      "passing_marks": "10.00",
      "status": "active",
      "answer_key_completed": true,
      "scans_count": 5,
      "results_count": 5
    }
  ]
}
```

### 3.2. Create Examination
- **Endpoint:** `POST /api/exams`
- **Access:** Teacher, Super Admin
- **Request Body:**
```json
{
  "title": "Mathematics Comprehensive Quiz",
  "subject_id": 3,
  "class_id": 1,
  "batch_ids": [1, 2],
  "template_id": 2,
  "exam_date": "2026-11-25",
  "duration_minutes": 60,
  "total_questions": 25,
  "marks_per_question": 1.0,
  "negative_marks_per_question": 0.25,
  "passing_marks": 10.0,
  "invalid_marking_penalty": 0.0,
  "status": "draft"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Examination created successfully.",
  "data": { "id": 2, "exam_code": "EXAM-9F81B...", ... }
}
```

### 3.3. Duplicate Examination
- **Endpoint:** `POST /api/exams/{id}/duplicate`
- **Access:** Teacher, Super Admin
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Examination duplicated with answer key template.",
  "data": { "id": 3, "title": "Copy of Physics First Midterm..." }
}
```

---

## 4. Answer Key Management

### 4.1. Get Examination Answer Key
- **Endpoint:** `GET /api/exams/{id}/answer-key`
- **Access:** Teacher, Super Admin
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "exam_id": 1,
    "version": 1,
    "is_active": true,
    "items": [
      { "question_number": 1, "correct_option": "A", "marks_weight": 1.0, "is_bonus": false },
      { "question_number": 2, "correct_option": "C", "marks_weight": 1.0, "is_bonus": false }
    ],
    "is_complete": true,
    "completed_count": 25,
    "total_questions": 25
  }
}
```

### 4.2. Update Answer Key
- **Endpoint:** `PUT /api/exams/{id}/answer-key`
- **Access:** Teacher, Super Admin
- **Request Body:**
```json
{
  "change_reason": "Corrected question 4 official answer to C",
  "items": [
    { "question_number": 1, "correct_option": "A", "marks_weight": 1.0 },
    { "question_number": 2, "correct_option": "C", "marks_weight": 1.0 },
    { "question_number": 3, "correct_option": "B", "marks_weight": 1.0 }
  ]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Answer key updated successfully. 5 existing results recalculated.",
  "data": { "version": 2, ... }
}
```

### 4.3. Bulk Parse Answer Key Text
- **Endpoint:** `POST /api/exams/{id}/answer-key/bulk-parse`
- **Access:** Teacher, Super Admin
- **Request Body:**
```json
{
  "raw_text": "1:A, 2:B, 3:C, 4:D, 5:A\n6=B 7=C 8=D 9=A 10=B"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "parsed_items": [
    { "question_number": 1, "correct_option": "A" },
    { "question_number": 2, "correct_option": "B" }
  ],
  "parsed_count": 10
}
```

---

## 5. OMR Sheet Generation & QR Resolution

### 5.1. Generate Printable OMR Sheets for Exam
- **Endpoint:** `GET /api/exams/{id}/sheets/generate`
- **Access:** Teacher, Super Admin
- **Query Params:** `batch_id`, `student_id`
- **Response (200 OK):**
```json
{
  "success": true,
  "institution": "Metropolitan Institute of Science & Technology",
  "exam": {
    "id": 1,
    "title": "Physics First Midterm Examination 2026",
    "subject": "Physics Paper 1",
    "exam_date": "2026-11-20",
    "total_questions": 25
  },
  "sheets": [
    {
      "sheet_uid": "SH-7X8F9021-173155",
      "student": {
        "id": 1,
        "student_uid": "STD-1001",
        "full_name": "Amina Rahman",
        "roll_no": "101",
        "reg_no": "REG-2026-001",
        "class_name": "Higher Secondary Class XII",
        "batch_name": "Science Group A"
      }
    }
  ]
}
```

### 5.2. Resolve Sheet by QR Identifier
- **Endpoint:** `GET /api/omr-sheets/resolve/{sheetUid}`
- **Access:** Public or Authenticated
- **Response (200 OK):**
```json
{
  "success": true,
  "sheet": {
    "sheet_uid": "SH-7X8F9021-173155",
    "exam": { "id": 1, "title": "Physics First Midterm", "exam_code": "PHY-MID-2026" },
    "student": { "id": 1, "name": "Amina Rahman", "roll_no": "101" }
  }
}
```

---

## 6. OMR Camera Scanner & Evaluation

### 6.1. Process OMR Sheet Image
- **Endpoint:** `POST /api/omr/scan`
- **Access:** Teacher, Super Admin
- **Request (multipart/form-data):**
  - `image`: Image file (JPEG/PNG/WebP, max 10MB)
  - `exam_id`: Integer ID of the examination
  - `student_id`: Optional Integer student ID (if QR was unreadable or manually selected)
  - `sheet_uid`: Optional String Sheet UID
  - `confirm_overwrite`: Optional Boolean (`true` to force overwrite previous finalized result)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OMR sheet processed and evaluated successfully.",
  "data": {
    "scan_id": 8,
    "scan_uid": "SCN-9A10F4-173155",
    "status": "completed",
    "review_status": "approved",
    "alignment_confidence": 0.98,
    "qr_detected": true,
    "qr_payload": "SH-7X8F9021-173155",
    "detected_answers": {
      "1": "A", "2": "C", "3": "B", "4": null, "5": "D"
    },
    "result": {
      "id": 8,
      "student_name": "Amina Rahman",
      "correct_count": 22,
      "wrong_count": 2,
      "blank_count": 1,
      "multiple_marked_count": 0,
      "raw_score": 22.0,
      "penalty_score": 0.5,
      "final_score": 21.5,
      "percentage": 86.0,
      "is_passed": true,
      "rank": 1
    },
    "annotated_image_url": "/storage/scans/processed/SCN-9A10F4-173155_annotated.jpg"
  }
}
```
- **Duplicate Result Warning (409 Conflict):**
```json
{
  "success": false,
  "is_duplicate": true,
  "message": "A finalized result already exists for this student on this examination. Do you want to rescan and overwrite the previous result?",
  "existing_result": {
    "result_id": 3,
    "final_score": 19.5,
    "percentage": 78.0,
    "evaluated_at": "2026-11-14 02:40:00"
  }
}
```

### 6.2. Manual Scan Review & Adjustment
- **Endpoint:** `POST /api/omr/scans/{id}/review`
- **Access:** Teacher, Super Admin
- **Request Body:**
```json
{
  "student_id": 1,
  "corrections": [
    {
      "question_number": 4,
      "option": "C",
      "status": "single",
      "comment": "Teacher confirmed eraser smudge on option D, option C was the intended answer."
    }
  ],
  "approve_evaluation": true
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Scan evaluation reviewed, approved, and recalculated successfully.",
  "data": { "result": { "final_score": 22.5, "rank": 1 } }
}
```

---

## 7. Results & Merit List Publication

### 7.1. Get Examination Merit List
- **Endpoint:** `GET /api/exams/{id}/merit-list`
- **Access:** Teacher, Super Admin
- **Response (200 OK):**
```json
{
  "success": true,
  "exam": { "id": 1, "title": "Physics First Midterm" },
  "summary": {
    "total_appeared": 5,
    "total_passed": 5,
    "total_failed": 0,
    "highest_score": 24.0,
    "lowest_score": 16.5,
    "average_score": 20.8
  },
  "merit_list": [
    {
      "rank": 1,
      "student_uid": "STD-1002",
      "student_name": "Rahim Uddin",
      "roll_no": "102",
      "correct_count": 24,
      "wrong_count": 1,
      "blank_count": 0,
      "final_score": 23.75,
      "percentage": 95.0,
      "is_passed": true,
      "status": "published"
    }
  ]
}
```

### 7.2. Export Merit List as CSV
- **Endpoint:** `GET /api/exams/{id}/merit-list/export-csv`
- **Access:** Teacher, Super Admin
- **Response:** CSV File download (`Content-Type: text/csv`)

### 7.3. Publish Results to Student Portal
- **Endpoint:** `POST /api/exams/{id}/results/publish`
- **Access:** Teacher, Super Admin
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "5 examination results published to student portal.",
  "published_count": 5
}
```

---

## 8. Student Portal Endpoints

### 8.1. Get Logged-in Student Published Results
- **Endpoint:** `GET /api/student-portal/results`
- **Access:** Student, Teacher, Super Admin
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "result_id": 1,
      "exam_title": "Physics First Midterm Examination 2026",
      "subject": "Physics Paper 1",
      "exam_date": "2026-11-20",
      "final_score": 23.75,
      "total_marks": 25.0,
      "percentage": 95.0,
      "rank": 1,
      "is_passed": true,
      "published_at": "2026-11-14 03:00:00"
    }
  ]
}
```

### 8.2. Get Detailed Result Question Breakdown
- **Endpoint:** `GET /api/student-portal/results/{id}`
- **Access:** Student (Own Result Only), Teacher, Super Admin
- **Response (200 OK):**
```json
{
  "success": true,
  "result": { ... },
  "breakdown": [
    {
      "question_number": 1,
      "student_answer": "A",
      "correct_answer": "A",
      "is_correct": true,
      "score_awarded": 1.0
    },
    {
      "question_number": 2,
      "student_answer": "B",
      "correct_answer": "C",
      "is_wrong": true,
      "score_awarded": -0.25
    }
  ]
}
```

