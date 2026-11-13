<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\OmrTemplate;
use App\Models\OmrSheet;
use App\Models\Student;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OmrSheetController extends Controller
{
    /**
     * Get all available OMR templates.
     */
    public function getTemplates()
    {
        $templates = OmrTemplate::where('is_active', true)->get();
        return response()->json(['success' => true, 'data' => $templates]);
    }

    /**
     * Generate or fetch printable OMR sheets for students assigned to an exam.
     */
    public function generateExamSheets(Request $request, string $examId)
    {
        $exam = Exam::with(['subject', 'schoolClass', 'template', 'batches.students'])->findOrFail($examId);

        // Gather all students enrolled in the assigned batches
        $students = collect();
        foreach ($exam->batches as $batch) {
            $batchStudents = Student::where('batch_id', $batch->id)
                ->where('status', 'active')
                ->orderBy('roll_no')
                ->get();
            $students = $students->merge($batchStudents);
        }
        $students = $students->unique('id');

        if ($students->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No active students found in the batches assigned to this examination.',
            ], 422);
        }

        $generatedSheets = [];
        foreach ($students as $student) {
            // Allocate or retrieve pre-allocated sheet UID
            $sheet = OmrSheet::firstOrCreate(
                ['exam_id' => $exam->id, 'student_id' => $student->id],
                [
                    'sheet_uid' => 'OMR-' . strtoupper(Str::random(12)) . '-' . $exam->id . '-' . $student->id,
                    'status' => 'generated',
                    'printed_at' => now(),
                ]
            );

            $generatedSheets[] = [
                'sheet_id' => $sheet->id,
                'sheet_uid' => $sheet->sheet_uid,
                'student' => [
                    'id' => $student->id,
                    'name' => $student->full_name,
                    'roll_no' => $student->roll_no,
                    'student_uid' => $student->student_uid,
                    'reg_no' => $student->reg_no,
                    'batch' => $student->batch?->name,
                ],
                'exam' => [
                    'id' => $exam->id,
                    'exam_code' => $exam->exam_code,
                    'title' => $exam->title,
                    'subject' => $exam->subject->name,
                    'total_questions' => $exam->total_questions,
                    'exam_date' => $exam->exam_date->format('Y-m-d'),
                ],
                'template' => $exam->template,
                'institution' => SystemSetting::get('institution_name', 'Apex Model International Academy'),
            ];
        }

        return response()->json([
            'success' => true,
            'message' => "Generated " . count($generatedSheets) . " printable OMR sheets.",
            'data' => [
                'exam' => $exam,
                'sheets' => $generatedSheets,
            ]
        ]);
    }

    /**
     * Resolve sheet QR code payload.
     */
    public function resolveSheet(string $sheetUid)
    {
        $sheet = OmrSheet::with(['exam.subject', 'exam.template', 'student.batch', 'student.schoolClass'])
            ->where('sheet_uid', $sheetUid)
            ->first();

        if (!$sheet) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or unrecognized OMR sheet identifier.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $sheet,
        ]);
    }
}

