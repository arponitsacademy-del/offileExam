<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Exam;
use App\Models\OmrScan;
use App\Models\Result;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get aggregate statistics and chart data for the main dashboard.
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        $totalStudents = Student::where('status', 'active')->count();
        $totalTeachers = Teacher::count();
        $totalExams = Exam::count();
        $totalScans = OmrScan::count();
        $totalPublishedResults = Result::where('status', 'published')->count();

        // Calculate average score and pass percentage across all finalized/published results
        $scoreStats = Result::whereIn('status', ['finalized', 'published'])
            ->selectRaw('AVG(percentage) as avg_score, SUM(CASE WHEN is_passed = 1 THEN 1 ELSE 0 END) as passed_count, COUNT(*) as total_count')
            ->first();

        $avgScore = $scoreStats && $scoreStats->total_count > 0 ? round((float)$scoreStats->avg_score, 1) : 0.0;
        $passPercentage = $scoreStats && $scoreStats->total_count > 0 ? round(((float)$scoreStats->passed_count / (float)$scoreStats->total_count) * 100, 1) : 0.0;

        // Recent exams
        $recentExams = Exam::with(['subject', 'schoolClass'])
            ->withCount(['results', 'scans'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        // Recent scans
        $recentScans = OmrScan::with(['exam', 'student', 'scanner'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        // Score Distribution for Charts (<40, 40-59, 60-79, 80-100)
        $scoreDistribution = [
            ['bracket' => '0-39% (Fail)', 'count' => Result::where('percentage', '<', 40)->count(), 'fill' => '#ef4444'],
            ['bracket' => '40-59% (Average)', 'count' => Result::whereBetween('percentage', [40, 59.99])->count(), 'fill' => '#f59e0b'],
            ['bracket' => '60-79% (Good)', 'count' => Result::whereBetween('percentage', [60, 79.99])->count(), 'fill' => '#3b82f6'],
            ['bracket' => '80-100% (Merit)', 'count' => Result::where('percentage', '>=', 80)->count(), 'fill' => '#10b981'],
        ];

        // Pass vs Fail comparison
        $passFailComparison = [
            ['name' => 'Passed', 'value' => (int)($scoreStats->passed_count ?? 0), 'color' => '#10b981'],
            ['name' => 'Failed', 'value' => (int)(($scoreStats->total_count ?? 0) - ($scoreStats->passed_count ?? 0)), 'color' => '#ef4444'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'counts' => [
                    'total_students' => $totalStudents,
                    'total_teachers' => $totalTeachers,
                    'total_exams' => $totalExams,
                    'total_scanned_sheets' => $totalScans,
                    'total_published_results' => $totalPublishedResults,
                    'average_score' => $avgScore,
                    'pass_percentage' => $passPercentage,
                ],
                'recent_exams' => $recentExams,
                'recent_scans' => $recentScans,
                'charts' => [
                    'score_distribution' => $scoreDistribution,
                    'pass_fail' => $passFailComparison,
                ]
            ]
        ]);
    }
}

