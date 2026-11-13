<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAnswerKey;
use App\Models\AnswerKeyItem;
use App\Models\AuditLog;
use App\Services\OmrEvaluationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnswerKeyController extends Controller
{
    /**
     * Get active and historical answer keys for an exam.
     */
    public function show(string $examId)
    {
        $exam = Exam::with(['activeAnswerKey.items', 'answerKeys.items', 'answerKeys.creator'])->findOrFail($examId);

        $activeKey = $exam->activeAnswerKey;
        $totalQuestions = $exam->total_questions;
        $completedCount = $activeKey ? $activeKey->items->count() : 0;
        $isComplete = ($completedCount === $totalQuestions);

        return response()->json([
            'success' => true,
            'data' => [
                'exam_id' => $exam->id,
                'exam_title' => $exam->title,
                'total_questions' => $totalQuestions,
                'active_key' => $activeKey,
                'is_complete' => $isComplete,
                'completed_count' => $completedCount,
                'has_published_results' => $exam->results()->where('status', 'published')->exists(),
                'version_history' => $exam->answerKeys,
            ]
        ]);
    }

    /**
     * Store or update an answer key (creates new version if results already exist).
     */
    public function update(Request $request, string $examId, OmrEvaluationService $evaluationService)
    {
        $exam = Exam::findOrFail($examId);

        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_number' => "required|integer|min:1|max:{$exam->total_questions}",
            'answers.*.correct_option' => 'required|in:A,B,C,D',
            'answers.*.marks_weight' => 'nullable|numeric|min:0.1',
            'answers.*.is_bonus' => 'nullable|boolean',
            'change_reason' => 'nullable|string|max:500',
            'auto_recalculate_results' => 'boolean',
        ]);

        $answers = $validated['answers'];
        if (count($answers) !== $exam->total_questions) {
            return response()->json([
                'success' => false,
                'message' => "Answer key must contain answers for all {$exam->total_questions} questions (received " . count($answers) . ").",
            ], 422);
        }

        $hasResults = $exam->results()->exists();
        $user = $request->user();

        // Enforce change reason if results exist
        if ($hasResults && empty($validated['change_reason'])) {
            return response()->json([
                'success' => false,
                'message' => 'Results have already been evaluated for this examination. A justification (change reason) is required to update the answer key.',
            ], 422);
        }

        return DB::transaction(function () use ($exam, $answers, $validated, $user, $hasResults, $evaluationService) {
            // Determine next version number
            $currentActive = $exam->activeAnswerKey;
            $nextVersion = $currentActive ? ($currentActive->version + 1) : 1;

            if ($currentActive) {
                $currentActive->update(['is_active' => false]);
            }

            $newKey = ExamAnswerKey::create([
                'exam_id' => $exam->id,
                'version' => $nextVersion,
                'is_active' => true,
                'created_by' => $user->id,
                'change_reason' => $validated['change_reason'] ?? ($nextVersion === 1 ? 'Initial Answer Key' : 'Answer Key Correction'),
            ]);

            foreach ($answers as $item) {
                AnswerKeyItem::create([
                    'answer_key_id' => $newKey->id,
                    'question_number' => $item['question_number'],
                    'correct_option' => strtoupper(trim($item['correct_option'])),
                    'marks_weight' => $item['marks_weight'] ?? 1.00,
                    'is_bonus' => $item['is_bonus'] ?? false,
                ]);
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'UPDATE_ANSWER_KEY',
                'entity_type' => 'ExamAnswerKey',
                'entity_id' => $newKey->id,
                'new_values' => ['version' => $nextVersion, 'items_count' => count($answers)],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            $recalculatedCount = 0;
            // If requested and results exist, automatically recalculate all scans with the new key!
            if ($validated['auto_recalculate_results'] ?? true) {
                $scans = $exam->scans()->whereIn('status', ['completed', 'requires_review'])->get();
                foreach ($scans as $scan) {
                    $detectedMap = $scan->answers->pluck('detected_option', 'question_number')->toArray();
                    $evaluationService->evaluateScan($scan, $detectedMap, true);
                    $recalculatedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Answer key version {$nextVersion} saved successfully." . ($recalculatedCount > 0 ? " Automatically recalculated {$recalculatedCount} student results." : ""),
                'data' => $newKey->load('items'),
                'recalculated_results_count' => $recalculatedCount,
            ]);
        });
    }

    /**
     * Bulk parse answer key string e.g. "ABCDABCD..." or "1:A,2:B..."
     */
    public function bulkParse(Request $request, string $examId)
    {
        $exam = Exam::findOrFail($examId);
        $raw = trim($request->input('raw_input', ''));

        // Remove whitespace and clean
        $clean = preg_replace('/[^A-Da-d]/', '', $raw);
        $answers = [];

        $limit = min(strlen($clean), $exam->total_questions);
        for ($i = 0; $i < $limit; $i++) {
            $answers[] = [
                'question_number' => $i + 1,
                'correct_option' => strtoupper($clean[$i]),
                'marks_weight' => 1.00,
                'is_bonus' => false,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'parsed_count' => count($answers),
                'total_required' => $exam->total_questions,
                'answers' => $answers,
            ]
        ]);
    }
}

