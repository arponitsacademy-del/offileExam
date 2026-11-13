<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Student;
use App\Models\OmrSheet;
use App\Models\OmrScan;
use App\Models\ScanAnswer;
use App\Models\ScanReview;
use App\Models\Result;
use App\Models\AuditLog;
use App\Services\OmrEvaluationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Exception;

class OmrScanController extends Controller
{
    /**
     * Upload an OMR sheet image, call Python recognition engine, and evaluate result.
     */
    public function scan(Request $request, OmrEvaluationService $evaluationService)
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,jpg,png,webp|max:15360', // Up to 15MB
            'exam_id' => 'required|exists:exams,id',
            'student_id' => 'nullable|exists:students,id',
            'sheet_uid' => 'nullable|string',
            'confirm_overwrite' => 'nullable|boolean',
        ]);

        $exam = Exam::with(['template', 'activeAnswerKey'])->findOrFail($request->exam_id);

        if (!$exam->activeAnswerKey) {
            return response()->json([
                'success' => false,
                'message' => 'Examination does not have an active answer key. Please configure the answer key before scanning.',
            ], 422);
        }

        $imageFile = $request->file('image');
        $scanUid = 'SCN-' . strtoupper(Str::random(12)) . '-' . time();

        // Store original image
        $originalFilename = "{$scanUid}." . $imageFile->getClientOriginalExtension();
        $originalPath = $imageFile->storeAs('scans/original', $originalFilename, 'public');

        // Check if Sheet UID is provided or if student is known
        $sheet = null;
        $studentId = $request->student_id;

        if ($request->filled('sheet_uid')) {
            $sheet = OmrSheet::where('sheet_uid', $request->sheet_uid)->first();
            if ($sheet) {
                $studentId = $sheet->student_id;
            }
        }

        // Check duplicate result if student is known and confirm_overwrite is not true
        if ($studentId && !$request->boolean('confirm_overwrite') && !$exam->allow_multiple_attempts) {
            $existingResult = Result::where('exam_id', $exam->id)
                ->where('student_id', $studentId)
                ->first();

            if ($existingResult) {
                return response()->json([
                    'success' => false,
                    'is_duplicate' => true,
                    'message' => 'A finalized result already exists for this student on this examination. Do you want to rescan and overwrite the previous result?',
                    'existing_result' => [
                        'result_id' => $existingResult->id,
                        'final_score' => $existingResult->final_score,
                        'percentage' => $existingResult->percentage,
                        'evaluated_at' => $existingResult->evaluated_at,
                    ]
                ], 409);
            }
        }

        // Initialize scan record
        $scan = OmrScan::create([
            'scan_uid' => $scanUid,
            'exam_id' => $exam->id,
            'student_id' => $studentId,
            'omr_sheet_id' => $sheet?->id,
            'original_image_path' => $originalPath,
            'scanned_by' => $request->user()->id,
            'status' => 'processing',
        ]);

        // Send to Python FastAPI OMR Microservice with resilient local CLI fallback
        $omrEngineUrl = env('OMR_ENGINE_URL', 'http://127.0.0.1:8001');
        $apiKey = env('OMR_ENGINE_API_KEY', 'smartomr_engine_internal_token_2026');
        $fullImagePath = Storage::disk('public')->path($originalPath);
        $engineData = null;

        try {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['X-OMR-API-KEY' => $apiKey])
                    ->attach('file', file_get_contents($fullImagePath), $originalFilename)
                    ->post("{$omrEngineUrl}/api/v1/omr/process", [
                        'template_code' => $exam->template->code,
                        'total_questions' => $exam->total_questions,
                        'options_per_question' => $exam->template->options_per_question ?? 4,
                    ]);

                if ($response->successful()) {
                    $engineData = $response->json();
                }
            } catch (\Exception $networkEx) {
                // Microservice daemon not running, invoke direct CLI fallback
                $engineData = $this->runPythonCli($fullImagePath, $exam->template->code, $exam->total_questions);
            }

            if (!$engineData || empty($engineData['success'])) {
                $scan->update([
                    'status' => 'failed',
                    'error_message' => 'OMR Engine error: failed to analyze sheet.',
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Image processing engine failed to recognize the sheet. Please ensure all 4 corner markers are clearly visible.',
                    'details' => $engineData,
                ], 422);
            }

            // Check if QR code was read by engine if sheet wasn't previously linked
            if (empty($studentId) && !empty($engineData['qr_code'])) {
                $detectedSheet = OmrSheet::where('sheet_uid', $engineData['qr_code'])->first();
                if ($detectedSheet) {
                    $sheet = $detectedSheet;
                    $studentId = $detectedSheet->student_id;
                    $scan->omr_sheet_id = $detectedSheet->id;
                    $scan->student_id = $detectedSheet->student_id;
                }
            }

            // Save processed annotated image if returned by engine
            $processedPath = null;
            if (!empty($engineData['processed_image_base64'])) {
                $processedFilename = "{$scanUid}_annotated.jpg";
                $decoded = base64_decode($engineData['processed_image_base64']);
                Storage::disk('public')->put("scans/processed/{$processedFilename}", $decoded);
                $processedPath = "scans/processed/{$processedFilename}";
            }

            // Persist detected answers
            $detectedAnswers = $engineData['detected_answers'] ?? [];
            $fillRatios = $engineData['fill_ratios'] ?? [];
            $uncertainList = $engineData['uncertain_questions'] ?? [];
            $multipleList = $engineData['multiple_marked'] ?? [];

            foreach ($detectedAnswers as $qNum => $option) {
                $qNumInt = (int)$qNum;
                $status = 'single';
                if (in_array($qNumInt, $uncertainList)) {
                    $status = 'uncertain';
                } elseif (in_array($qNumInt, $multipleList)) {
                    $status = 'multiple';
                } elseif ($option === null || $option === '') {
                    $status = 'blank';
                }

                $ratios = $fillRatios[$qNum] ?? [];

                ScanAnswer::create([
                    'scan_id' => $scan->id,
                    'question_number' => $qNumInt,
                    'detected_option' => $option,
                    'fill_ratio_a' => $ratios['A'] ?? 0.0,
                    'fill_ratio_b' => $ratios['B'] ?? 0.0,
                    'fill_ratio_c' => $ratios['C'] ?? 0.0,
                    'fill_ratio_d' => $ratios['D'] ?? 0.0,
                    'status' => $status,
                ]);
            }

            $scanStatus = count($uncertainList) > 0 ? 'requires_review' : 'completed';
            $scan->update([
                'student_id' => $studentId,
                'processed_image_path' => $processedPath,
                'status' => $scanStatus,
                'alignment_confidence' => $engineData['quality_checks']['alignment_confidence'] ?? 1.0,
                'qr_detected' => !empty($engineData['qr_code']),
                'qr_payload' => $engineData['qr_code'] ?? null,
                'raw_engine_response' => $engineData,
                'review_status' => count($uncertainList) > 0 ? 'pending' : 'approved',
            ]);

            // If student is known, calculate examination result
            $result = null;
            if ($studentId) {
                $result = $evaluationService->evaluateScan($scan, $detectedAnswers, $request->boolean('confirm_overwrite'));
            }

            return response()->json([
                'success' => true,
                'message' => count($uncertainList) > 0 
                    ? "OMR processed with " . count($uncertainList) . " uncertain question(s) requiring teacher verification."
                    : "OMR sheet successfully recognized and evaluated.",
                'data' => [
                    'scan' => $scan->fresh(['answers', 'student', 'exam.subject', 'exam.schoolClass']),
                    'result' => $result,
                    'requires_review' => count($uncertainList) > 0,
                    'uncertain_questions' => $uncertainList,
                    'multiple_marked' => $multipleList,
                ]
            ]);

        } catch (Exception $e) {
            $scan->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Processing error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List all scan history.
     */
    public function index(Request $request)
    {
        $query = OmrScan::with(['exam.subject', 'student', 'scanner', 'result']);

        if ($request->filled('exam_id')) {
            $query->where('exam_id', $request->exam_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('review_status')) {
            $query->where('review_status', $request->review_status);
        }

        $scans = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $scans,
        ]);
    }

    /**
     * Show detailed scan record with answers, student, and images.
     */
    public function show(string $id)
    {
        $scan = OmrScan::with([
            'exam.subject',
            'exam.activeAnswerKey.items',
            'student.batch',
            'student.schoolClass',
            'scanner',
            'answers',
            'reviews.reviewer',
            'result.answers',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $scan,
        ]);
    }

    /**
     * Manual Review: Update uncertain or misdetected answers and recalculate result.
     */
    public function review(Request $request, string $id, OmrEvaluationService $evaluationService)
    {
        $scan = OmrScan::with(['answers', 'exam', 'student'])->findOrFail($id);

        $validated = $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'corrections' => 'required|array',
            'corrections.*.question_number' => 'required|integer|min:1',
            'corrections.*.option' => 'nullable|in:A,B,C,D',
            'corrections.*.status' => 'required|in:single,blank,multiple,invalid',
            'corrections.*.comment' => 'nullable|string|max:255',
            'approve_evaluation' => 'boolean',
        ]);

        $user = $request->user();

        // Update student assignment if corrected manually
        if (!empty($validated['student_id'])) {
            $scan->student_id = $validated['student_id'];
            $scan->save();
        }

        foreach ($validated['corrections'] as $corr) {
            $ans = $scan->answers()->where('question_number', $corr['question_number'])->first();
            if ($ans) {
                $prevOpt = $ans->detected_option;
                $ans->update([
                    'detected_option' => $corr['option'],
                    'status' => $corr['status'],
                ]);

                ScanReview::create([
                    'scan_id' => $scan->id,
                    'reviewer_id' => $user->id,
                    'question_number' => $corr['question_number'],
                    'previous_option' => $prevOpt,
                    'revised_option' => $corr['option'],
                    'revised_status' => $corr['status'],
                    'comment' => $corr['comment'] ?? 'Manual review adjustment',
                ]);
            }
        }

        $scan->update([
            'review_status' => 'approved',
            'status' => 'completed',
        ]);

        // Recalculate result
        $detectedMap = $scan->fresh('answers')->answers->pluck('detected_option', 'question_number')->toArray();
        $result = $evaluationService->evaluateScan($scan, $detectedMap, true);

        return response()->json([
            'success' => true,
            'message' => 'Scan evaluation reviewed, approved, and recalculated successfully.',
            'data' => [
                'scan' => $scan->fresh(['answers', 'reviews.reviewer']),
                'result' => $result,
            ]
        ]);
    }

    /**
     * Resilient direct invocation of Python OMR CLI if microservice daemon is offline.
     */
    protected function runPythonCli(string $imagePath, string $templateCode, int $totalQuestions): array
    {
        $pythonPath = base_path('../python311/python.exe');
        if (!file_exists($pythonPath)) {
            $pythonPath = 'python';
        }
        $cliScript = base_path('../omr-engine/app/engine/cli.py');
        $cmd = sprintf(
            '"%s" "%s" --image "%s" --template "%s" --questions %d',
            $pythonPath,
            $cliScript,
            $imagePath,
            $templateCode,
            $totalQuestions
        );
        $output = shell_exec($cmd);
        $data = json_decode($output, true);
        if (!$data || !($data['success'] ?? false)) {
            throw new Exception("Local Python OMR execution failed: " . ($output ?: 'No output'));
        }
        return $data;
    }
}
