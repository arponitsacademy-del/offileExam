<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Batch;
use App\Models\Section;
use App\Models\Subject;
use Illuminate\Http\Request;

class AcademicController extends Controller
{
    // ================= CLASSES =================
    public function getClasses()
    {
        $classes = SchoolClass::withCount(['batches', 'students'])->get();
        return response()->json(['success' => true, 'data' => $classes]);
    }

    public function storeClass(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:classes,code',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $class = SchoolClass::create($validated);
        return response()->json(['success' => true, 'message' => 'Class created.', 'data' => $class], 201);
    }

    public function updateClass(Request $request, string $id)
    {
        $class = SchoolClass::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => "required|string|max:50|unique:classes,code,{$class->id}",
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $class->update($validated);
        return response()->json(['success' => true, 'message' => 'Class updated.', 'data' => $class]);
    }

    // ================= BATCHES =================
    public function getBatches(Request $request)
    {
        $query = Batch::with(['schoolClass', 'sections'])->withCount('students');
        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        $batches = $query->get();
        return response()->json(['success' => true, 'data' => $batches]);
    }

    public function storeBatch(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'name' => 'required|string|max:100',
            'session' => 'nullable|string|max:50',
            'max_students' => 'required|integer|min:1',
            'status' => 'required|in:active,inactive',
        ]);

        $batch = Batch::create($validated);
        return response()->json(['success' => true, 'message' => 'Batch created.', 'data' => $batch->load('schoolClass')], 201);
    }

    public function updateBatch(Request $request, string $id)
    {
        $batch = Batch::findOrFail($id);
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'name' => 'required|string|max:100',
            'session' => 'nullable|string|max:50',
            'max_students' => 'required|integer|min:1',
            'status' => 'required|in:active,inactive',
        ]);

        $batch->update($validated);
        return response()->json(['success' => true, 'message' => 'Batch updated.', 'data' => $batch->load('schoolClass')]);
    }

    // ================= SECTIONS =================
    public function getSections(Request $request)
    {
        $query = Section::with('batch');
        if ($request->filled('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function storeSection(Request $request)
    {
        $validated = $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'name' => 'required|string|max:50',
            'room_no' => 'nullable|string|max:50',
        ]);

        $section = Section::create($validated);
        return response()->json(['success' => true, 'message' => 'Section created.', 'data' => $section->load('batch')], 201);
    }

    // ================= SUBJECTS =================
    public function getSubjects()
    {
        $subjects = Subject::withCount('exams')->get();
        return response()->json(['success' => true, 'data' => $subjects]);
    }

    public function storeSubject(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:subjects,code',
            'description' => 'nullable|string',
        ]);

        $subject = Subject::create($validated);
        return response()->json(['success' => true, 'message' => 'Subject created.', 'data' => $subject], 201);
    }
}

