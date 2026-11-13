<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamAnswerKey;
use App\Models\OmrScan;
use App\Models\Result;
use App\Models\ResultAnswer;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Exception;

class OmrEvaluationService
{
    /**
     * Evaluate detected answers from an OMR scan and compute the exam result.
     *
     * @param OmrScan $scan
     * @param array $detectedAnswers Key-value array of [question_number => detected_option or null]
     * @param bool $allowOverwrite Whether to replace an existing finalized result if one exists
     * @return Result
     * @throws Exception
     */
    public function evaluateScan(OmrScan $scan, array $detectedAnswers, bool $allowOverwrite = false): Result
    {
        $exam = $scan->exam;
        if (!$exam) {
            throw new Exception("Scan is not attached to a valid examination.");
        }

        $activeKey = $exam->activeAnswerKey;
        if (!$activeKey) {
            throw new Exception("Examination [{$exam->title}] does not have an active answer key configured.");
        }

        $keyItems = $activeKey->items->keyBy('question_number');
        if ($keyItems->isEmpty()) {
            throw new Exception("Active answer key does not contain question definitions.");
        }

        // Student identification check
        if (!$scan->student_id) {
            throw new Exception("Cannot finalize result: student has not been identified on this sheet.");
        }

        return DB::transaction(function () use ($scan, $exam, $keyItems, $detectedAnswers, $allowOverwrite) {
            // Check for existing result for this student and exam
            $existingResult = Result::where('exam_id', $exam->id)
                ->where('student_id', $scan->student_id)
                ->first();

            if ($existingResult && !$allowOverwrite && !$exam->allow_multiple_attempts) {
                throw new Exception("A finalized result already exists for Student ID [{$scan->student_id}] on this examination. Confirm rescanning to overwrite.");
            }

            $correctCount = 0;
            $wrongCount = 0;
            $blankCount = 0;
            $multipleCount = 0;
            $uncertainCount = 0;

            $totalQuestions = $exam->total_questions;
            $marksPerQuestion = (float)$exam->marks_per_question;
            $negativeMarks = (float)$exam->negative_marks_per_question;
            $invalidPenalty = (float)$exam->invalid_marking_penalty;
            $passingMarks = (float)$exam->passing_marks;

            $answersToInsert = [];

            // Fetch scan answers to get status (e.g. uncertain, multiple, blank)
            $scanAnswers = $scan->answers->keyBy('question_number');

            for ($q = 1; $q <= $totalQuestions; $q++) {
                $keyItem = $keyItems->get($q);
                $correctOpt = $keyItem ? strtoupper(trim($keyItem->correct_option)) : null;
                $isBonus = $keyItem ? (bool)$keyItem->is_bonus : false;
                $weight = $keyItem ? (float)$keyItem->marks_weight : 1.0;

                $studentOpt = isset($detectedAnswers[$q]) ? strtoupper(trim((string)$detectedAnswers[$q])) : null;
                if ($studentOpt === '' || $studentOpt === 'NULL') {
                    $studentOpt = null;
                }

                $scanAnsRecord = $scanAnswers->get($q);
                $markStatus = $scanAnsRecord ? $scanAnsRecord->status : ($studentOpt ? 'single' : 'blank');

                $isCorrect = false;
                $isWrong = false;
                $isBlank = false;
                $isInvalid = false;
                $scoreAwarded = 0.0;

                if ($isBonus) {
                    $isCorrect = true;
                    $scoreAwarded = $marksPerQuestion * $weight;
                    $correctCount++;
                } elseif ($markStatus === 'uncertain') {
                    $uncertainCount++;
                    // Ambiguous answers cannot be treated as valid answers silently
                    $scoreAwarded = 0.0;
                } elseif ($markStatus === 'multiple') {
                    $multipleCount++;
                    $isInvalid = true;
                    $scoreAwarded = -$invalidPenalty;
                } elseif ($studentOpt === null || $markStatus === 'blank') {
                    $blankCount++;
                    $isBlank = true;
                    $scoreAwarded = 0.0;
                } elseif ($studentOpt === $correctOpt) {
                    $isCorrect = true;
                    $scoreAwarded = $marksPerQuestion * $weight;
                    $correctCount++;
                } else {
                    $isWrong = true;
                    $scoreAwarded = -$negativeMarks;
                    $wrongCount++;
                }

                $answersToInsert[] = [
                    'question_number' => $q,
                    'student_answer' => $studentOpt,
                    'correct_answer' => $correctOpt ?? 'A',
                    'is_correct' => $isCorrect,
                    'is_wrong' => $isWrong,
                    'is_blank' => $isBlank,
                    'is_invalid' => $isInvalid,
                    'score_awarded' => $scoreAwarded,
                ];
            }

            $rawScore = $correctCount * $marksPerQuestion;
            $penaltyScore = ($wrongCount * $negativeMarks) + ($multipleCount * $invalidPenalty);
            $finalScore = max(0.0, round($rawScore - $penaltyScore, 2));

            $maxPossibleScore = $totalQuestions * $marksPerQuestion;
            $percentage = $maxPossibleScore > 0 ? round(($finalScore / $maxPossibleScore) * 100, 2) : 0.0;
            $isPassed = $finalScore >= $passingMarks;

            // Determine result status: if any questions are uncertain, flag as pending_review
            $resultStatus = ($uncertainCount > 0) ? 'pending_review' : 'finalized';

            // Delete existing result answers if overwriting
            if ($existingResult) {
                AuditLog::create([
                    'user_id' => auth()->id() ?? $scan->scanned_by,
                    'action' => 'OVERWRITE_RESULT',
                    'entity_type' => 'Result',
                    'entity_id' => $existingResult->id,
                    'old_values' => $existingResult->toArray(),
                    'new_values' => ['final_score' => $finalScore, 'scan_id' => $scan->id],
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);

                $existingResult->answers()->delete();
                $result = $existingResult;
            } else {
                $result = new Result();
            }

            $result->fill([
                'exam_id' => $exam->id,
                'student_id' => $scan->student_id,
                'scan_id' => $scan->id,
                'total_questions' => $totalQuestions,
                'correct_count' => $correctCount,
                'wrong_count' => $wrongCount,
                'blank_count' => $blankCount,
                'multiple_marked_count' => $multipleCount,
                'uncertain_count' => $uncertainCount,
                'raw_score' => $rawScore,
                'penalty_score' => $penaltyScore,
                'final_score' => $finalScore,
                'percentage' => $percentage,
                'is_passed' => $isPassed,
                'status' => $resultStatus,
                'evaluated_at' => now(),
            ]);
            $result->save();

            // Insert breakdown
            foreach ($answersToInsert as $item) {
                $item['result_id'] = $result->id;
                $item['created_at'] = now();
                $item['updated_at'] = now();
                ResultAnswer::create($item);
            }

            // Recalculate merit list ranks for this exam
            $this->recalculateRanks($exam->id);

            return $result->fresh(['answers', 'student', 'exam']);
        });
    }

    /**
     * Recalculate ranks for finalized results in an examination.
     */
    public function recalculateRanks(int $examId): void
    {
        $finalizedResults = Result::where('exam_id', $examId)
            ->whereIn('status', ['finalized', 'published'])
            ->orderByDesc('final_score')
            ->orderBy('wrong_count') // Tie-breaker 1: fewer wrong answers ranks higher
            ->orderBy('id')          // Tie-breaker 2: deterministic ordering
            ->get();

        $rank = 1;
        foreach ($finalizedResults as $res) {
            $res->rank = $rank++;
            $res->save();
        }
    }
}

