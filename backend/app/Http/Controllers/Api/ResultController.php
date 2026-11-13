<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Result;
use App\Models\Student;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ResultController extends Controller
{
    /**
     * Get all results for an exam.
     */
    public function getExamResults(Request $request, string $examId)
    {
        $exam = Exam::with(['subject', 'schoolClass'])->findOrFail($examId);

        $query = Result::with(['student.batch', 'student.schoolClass', 'scan'])
            ->where('exam_id', $examId);

        if ($request->filled('batch_id')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('batch_id', $request->batch_id);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $results = $query->orderBy('rank')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'exam' => $exam,
                'results' => $results,
            ]
        ]);
    }

    /**
     * Get merit list and statistical analytics for an exam.
     */
    public function getMeritList(Request $request, string $examId)
    {
        $exam = Exam::with(['subject', 'schoolClass'])->findOrFail($examId);

        $query = Result::with(['student.batch', 'student.schoolClass'])
            ->where('exam_id', $examId)
            ->whereIn('status', ['finalized', 'published']);

        if ($request->filled('batch_id')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('batch_id', $request->batch_id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('roll_no', 'like', "%{$search}%")
                  ->orWhere('reg_no', 'like', "%{$search}%");
            });
        }

        $meritList = $query->orderBy('rank')->get();

        // Calculate metrics
        $totalCandidates = $meritList->count();
        $highestScore = $meritList->max('final_score') ?? 0;
        $lowestScore = $meritList->min('final_score') ?? 0;
        $averageScore = $totalCandidates > 0 ? round($meritList->avg('final_score'), 2) : 0;
        $passedCount = $meritList->where('is_passed', true)->count();
        $passRate = $totalCandidates > 0 ? round(($passedCount / $totalCandidates) * 100, 2) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'exam' => $exam,
                'statistics' => [
                    'total_candidates' => $totalCandidates,
                    'highest_score' => $highestScore,
                    'lowest_score' => $lowestScore,
                    'average_score' => $averageScore,
                    'passed_count' => $passedCount,
                    'failed_count' => $totalCandidates - $passedCount,
                    'pass_percentage' => $passRate,
                ],
                'merit_list' => $meritList,
            ]
        ]);
    }

    /**
     * Publish results for an examination.
     */
    public function publishResults(Request $request, string $examId)
    {
        $exam = Exam::findOrFail($examId);

        $count = Result::where('exam_id', $examId)
            ->where('status', 'finalized')
            ->update([
                'status' => 'published',
                'published_at' => now(),
            ]);

        $exam->update(['status' => 'published']);

        return response()->json([
            'success' => true,
            'message' => "Published {$count} examination results. Students may now view their results in the portal.",
        ]);
    }

    /**
     * Get single result breakdown.
     */
    public function show(string $id)
    {
        $result = Result::with([
            'exam.subject',
            'exam.schoolClass',
            'student.batch',
            'student.schoolClass',
            'answers',
            'scan'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Student Portal: Get published results for the logged in student.
     */
    public function studentResults(Request $request)
    {
        $user = $request->user();
        $student = $user->studentProfile;

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'No student profile linked to this user account.',
            ], 404);
        }

        $results = Result::with(['exam.subject', 'exam.schoolClass'])
            ->where('student_id', $student->id)
            ->where('status', 'published') // ONLY published results
            ->orderByDesc('published_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'student' => $student,
                'results' => $results,
            ]
        ]);
    }

    /**
     * Student Portal: Single result with answer review (only if published).
     */
    public function studentResultDetails(Request $request, string $id)
    {
        $user = $request->user();
        $student = $user->studentProfile;

        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $result = Result::with(['exam.subject', 'exam.schoolClass', 'answers'])
            ->where('id', $id)
            ->where('student_id', $student->id)
            ->where('status', 'published')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Export merit list as CSV.
     */
    public function exportMeritCsv(Request $request, string $examId)
    {
        $exam = Exam::with('subject')->findOrFail($examId);
        $results = Result::with(['student.batch'])
            ->where('exam_id', $examId)
            ->whereIn('status', ['finalized', 'published'])
            ->orderBy('rank')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"merit_list_{$exam->exam_code}_" . date('Ymd_His') . ".csv\"",
        ];

        $callback = function () use ($results, $exam) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Rank', 'Roll No', 'Registration No', 'Student Name', 'Batch', 'Correct', 'Wrong', 'Blank', 'Score', 'Percentage', 'Status']);

            foreach ($results as $res) {
                fputcsv($file, [
                    $res->rank ?? 'N/A',
                    $res->student?->roll_no ?? '',
                    $res->student?->reg_no ?? '',
                    $res->student?->full_name ?? '',
                    $res->student?->batch?->name ?? '',
                    $res->correct_count,
                    $res->wrong_count,
                    $res->blank_count,
                    $res->final_score,
                    $res->percentage . '%',
                    $res->is_passed ? 'PASSED' : 'FAILED',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

