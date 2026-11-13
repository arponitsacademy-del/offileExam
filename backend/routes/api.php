<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\AcademicController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\AnswerKeyController;
use App\Http\Controllers\Api\OmrSheetController;
use App\Http\Controllers\Api\OmrScanController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\SettingController;

// 1. Public Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Sheet QR resolve (can be public or authenticated)
Route::get('/omr-sheets/resolve/{sheetUid}', [OmrSheetController::class, 'resolveSheet']);

// 2. Authenticated Routes (Laravel Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // User session & profile
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });

    // Student Portal Routes (accessible to Students, Teachers, and Super Admin)
    Route::middleware('role:student,teacher,super_admin')->group(function () {
        Route::get('/student-portal/results', [ResultController::class, 'studentResults']);
        Route::get('/student-portal/results/{id}', [ResultController::class, 'studentResultDetails']);
    });

    // Teacher & Super Admin Routes
    Route::middleware('role:teacher,super_admin')->group(function () {
        
        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

        // Academic Lookups
        Route::get('/classes', [AcademicController::class, 'getClasses']);
        Route::get('/batches', [AcademicController::class, 'getBatches']);
        Route::get('/sections', [AcademicController::class, 'getSections']);
        Route::get('/subjects', [AcademicController::class, 'getSubjects']);
        Route::get('/omr-templates', [OmrSheetController::class, 'getTemplates']);

        // Students Management
        Route::get('/students', [StudentController::class, 'index']);
        Route::post('/students', [StudentController::class, 'store']);
        Route::get('/students/export-csv', [StudentController::class, 'exportCsv']);
        Route::post('/students/import-csv', [StudentController::class, 'importCsv']);
        Route::get('/students/{id}', [StudentController::class, 'show']);
        Route::put('/students/{id}', [StudentController::class, 'update']);
        Route::delete('/students/{id}', [StudentController::class, 'destroy']);
        Route::get('/students/{id}/results', [StudentController::class, 'results']);

        // Examination Management
        Route::get('/exams', [ExamController::class, 'index']);
        Route::post('/exams', [ExamController::class, 'store']);
        Route::get('/exams/{id}', [ExamController::class, 'show']);
        Route::put('/exams/{id}', [ExamController::class, 'update']);
        Route::delete('/exams/{id}', [ExamController::class, 'destroy']);
        Route::post('/exams/{id}/duplicate', [ExamController::class, 'duplicate']);

        // Answer Key Management
        Route::get('/exams/{id}/answer-key', [AnswerKeyController::class, 'show']);
        Route::put('/exams/{id}/answer-key', [AnswerKeyController::class, 'update']);
        Route::post('/exams/{id}/answer-key/bulk-parse', [AnswerKeyController::class, 'bulkParse']);

        // OMR Sheet Generator
        Route::get('/exams/{id}/sheets/generate', [OmrSheetController::class, 'generateExamSheets']);

        // OMR Mobile Scanner & Engine Integration
        Route::post('/omr/scan', [OmrScanController::class, 'scan']);
        Route::get('/omr/scans', [OmrScanController::class, 'index']);
        Route::get('/omr/scans/{id}', [OmrScanController::class, 'show']);
        Route::post('/omr/scans/{id}/review', [OmrScanController::class, 'review']);

        // Examination Results & Merit Lists
        Route::get('/exams/{id}/results', [ResultController::class, 'getExamResults']);
        Route::get('/exams/{id}/merit-list', [ResultController::class, 'getMeritList']);
        Route::get('/exams/{id}/merit-list/export-csv', [ResultController::class, 'exportMeritCsv']);
        Route::post('/exams/{id}/results/publish', [ResultController::class, 'publishResults']);
        Route::get('/results/{id}', [ResultController::class, 'show']);
    });

    // Super Admin Only Management Routes
    Route::middleware('role:super_admin')->group(function () {
        // Teacher management
        Route::apiResource('teachers', TeacherController::class);

        // Academic structural updates
        Route::post('/classes', [AcademicController::class, 'storeClass']);
        Route::put('/classes/{id}', [AcademicController::class, 'updateClass']);
        Route::post('/batches', [AcademicController::class, 'storeBatch']);
        Route::put('/batches/{id}', [AcademicController::class, 'updateBatch']);
        Route::post('/sections', [AcademicController::class, 'storeSection']);
        Route::post('/subjects', [AcademicController::class, 'storeSubject']);

        // System Settings
        Route::get('/settings', [SettingController::class, 'index']);
        Route::post('/settings', [SettingController::class, 'update']);
    });
});
