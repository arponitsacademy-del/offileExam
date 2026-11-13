<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAssignment;
use App\Models\OmrTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExamController extends Controller
{
    /**
     * List examinations with filtering and stats.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Exam::with(['subject', 'schoolClass', 'template', 'batches', 'creator'])
            ->withCount(['scans', 'results']);

        // Teachers can view all or their own permitted exams
        if ($user->isTeacher() && $request->boolean('my_exams_only')) {
            $query->where('created_by', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('exam_code', 'like', "%{$search}%");
            });
        }

        $exams = $query->orderByDesc('exam_date')->get();

        return response()->json([
            'success' => true,
            'data' => $exams,
        ]);
    }

    /**
     * Create a new examination.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'exam_code' => 'required|string|max:50|unique:exams,exam_code',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
            'template_id' => 'required|exists:omr_templates,id',
            'exam_date' => 'required|date',
            'duration_minutes' => 'required|integer|min:5|max:300',
            'total_questions' => 'required|in:20,25,50,100',
            'marks_per_question' => 'required|numeric|min:0.25',
            'negative_marks_per_question' => 'required|numeric|min:0',
            'passing_marks' => 'required|numeric|min:0',
            'invalid_marking_penalty' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,active,completed,published',
            'allow_multiple_attempts' => 'boolean',
            'batch_ids' => 'required|array|min:1',
            'batch_ids.*' => 'exists:batches,id',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $exam = Exam::create([
                'exam_code' => $validated['exam_code'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'subject_id' => $validated['subject_id'],
                'class_id' => $validated['class_id'],
                'created_by' => $request->user()->id,
                'template_id' => $validated['template_id'],
                'exam_date' => $validated['exam_date'],
                'duration_minutes' => $validated['duration_minutes'],
                'total_questions' => (int)$validated['total_questions'],
                'marks_per_question' => $validated['marks_per_question'],
                'negative_marks_per_question' => $validated['negative_marks_per_question'],
                'passing_marks' => $validated['passing_marks'],
                'invalid_marking_penalty' => $validated['invalid_marking_penalty'] ?? 0.00,
                'status' => $validated['status'],
                'allow_multiple_attempts' => $request->boolean('allow_multiple_attempts'),
            ]);

            foreach ($validated['batch_ids'] as $batchId) {
                ExamAssignment::create([
                    'exam_id' => $exam->id,
                    'batch_id' => $batchId,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Examination created successfully.',
                'data' => $exam->load(['subject', 'schoolClass', 'template', 'batches']),
            ], 201);
        });
    }

    /**
     * Show single examination details with answer key status and counts.
     */
    public function show(string $id)
    {
        $exam = Exam::with(['subject', 'schoolClass', 'template', 'batches', 'creator', 'activeAnswerKey.items'])
            ->withCount(['scans', 'results'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $exam,
        ]);
    }

    /**
     * Update examination.
     */
    public function update(Request $request, string $id)
    {
        $exam = Exam::findOrFail($id);

        // Prevent modification of question count or template if scans/results already exist
        $hasEvaluations = $exam->results()->exists() || $exam->scans()->exists();

        $rules = [
            'exam_code' => "required|string|max:50|unique:exams,exam_code,{$exam->id}",
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
            'exam_date' => 'required|date',
            'duration_minutes' => 'required|integer|min:5|max:300',
            'marks_per_question' => 'required|numeric|min:0.25',
            'negative_marks_per_question' => 'required|numeric|min:0',
            'passing_marks' => 'required|numeric|min:0',
            'invalid_marking_penalty' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,active,completed,published',
            'allow_multiple_attempts' => 'boolean',
            'batch_ids' => 'required|array|min:1',
            'batch_ids.*' => 'exists:batches,id',
        ];

        if (!$hasEvaluations) {
            $rules['template_id'] = 'required|exists:omr_templates,id';
            $rules['total_questions'] = 'required|in:20,25,50,100';
        }

        $validated = $request->validate($rules);

        return DB::transaction(function () use ($exam, $validated, $request, $hasEvaluations) {
            $exam->fill([
                'exam_code' => $validated['exam_code'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'subject_id' => $validated['subject_id'],
                'class_id' => $validated['class_id'],
                'exam_date' => $validated['exam_date'],
                'duration_minutes' => $validated['duration_minutes'],
                'marks_per_question' => $validated['marks_per_question'],
                'negative_marks_per_question' => $validated['negative_marks_per_question'],
                'passing_marks' => $validated['passing_marks'],
                'invalid_marking_penalty' => $validated['invalid_marking_penalty'] ?? 0.00,
                'status' => $validated['status'],
                'allow_multiple_attempts' => $request->boolean('allow_multiple_attempts'),
            ]);

            if (!$hasEvaluations) {
                $exam->template_id = $validated['template_id'];
                $exam->total_questions = (int)$validated['total_questions'];
            }

            $exam->save();

            // Sync batches
            $exam->assignments()->delete();
            foreach ($validated['batch_ids'] as $batchId) {
                ExamAssignment::create([
                    'exam_id' => $exam->id,
                    'batch_id' => $batchId,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Examination updated successfully.',
                'data' => $exam->fresh(['subject', 'schoolClass', 'template', 'batches']),
            ]);
        });
    }

    /**
     * Duplicate examination into a new draft.
     */
    public function duplicate(Request $request, string $id)
    {
        $original = Exam::with(['batches', 'activeAnswerKey.items'])->findOrFail($id);

        return DB::transaction(function () use ($original, $request) {
            $newCode = $original->exam_code . '-COPY-' . strtoupper(Str::random(4));
            $copy = $original->replicate([
                'exam_code',
                'title',
                'status',
            ]);
            $copy->exam_code = $newCode;
            $copy->title = $original->title . ' (Copy)';
            $copy->status = 'draft';
            $copy->created_by = $request->user()->id;
            $copy->save();

            // Duplicate assignments
            foreach ($original->batches as $batch) {
                ExamAssignment::create([
                    'exam_id' => $copy->id,
                    'batch_id' => $batch->id,
                ]);
            }

            // Duplicate answer key if exists
            if ($original->activeAnswerKey) {
                $newKey = $copy->answerKeys()->create([
                    'version' => 1,
                    'is_active' => true,
                    'created_by' => $request->user()->id,
                    'change_reason' => "Duplicated from {$original->exam_code}",
                ]);

                foreach ($original->activeAnswerKey->items as $item) {
                    $newKey->items()->create([
                        'question_number' => $item->question_number,
                        'correct_option' => $item->correct_option,
                        'marks_weight' => $item->marks_weight,
                        'is_bonus' => $item->is_bonus,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Examination duplicated.',
                'data' => $copy->load(['subject', 'schoolClass', 'template', 'batches']),
            ]);
        });
    }

    /**
     * Delete examination.
     */
    public function destroy(string $id)
    {
        $exam = Exam::findOrFail($id);

        if ($exam->results()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete examination that has finalized results. Archive it by changing status to Completed instead.',
            ], 422);
        }

        $exam->delete();

        return response()->json([
            'success' => true,
            'message' => 'Examination deleted successfully.',
        ]);
    }
}

