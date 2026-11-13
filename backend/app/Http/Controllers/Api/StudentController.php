<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    /**
     * List students with search, filters, and pagination.
     */
    public function index(Request $request)
    {
        $query = Student::with(['schoolClass', 'batch', 'section']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_uid', 'like', "%{$search}%")
                  ->orWhere('roll_no', 'like', "%{$search}%")
                  ->orWhere('reg_no', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = (int)$request->get('per_page', 15);
        $students = $query->orderBy('roll_no')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    /**
     * Store a newly created student.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_uid' => 'required|string|max:50|unique:students,student_uid',
            'roll_no' => 'required|string|max:50',
            'reg_no' => 'required|string|max:50|unique:students,reg_no',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'class_id' => 'required|exists:classes,id',
            'batch_id' => 'required|exists:batches,id',
            'section_id' => 'nullable|exists:sections,id',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:150|unique:users,email|unique:students,email',
            'status' => 'required|in:active,inactive',
            'create_user_account' => 'boolean',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $userId = null;

            if ($request->boolean('create_user_account') && !empty($validated['email'])) {
                $user = User::create([
                    'name' => "{$validated['first_name']} {$validated['last_name']}",
                    'email' => $validated['email'],
                    'password' => Hash::make($request->get('password', 'Student@123456')),
                    'role' => 'student',
                    'phone' => $validated['phone'] ?? null,
                    'status' => $validated['status'],
                ]);
                $userId = $user->id;
            }

            $student = Student::create([
                'user_id' => $userId,
                'student_uid' => $validated['student_uid'],
                'roll_no' => $validated['roll_no'],
                'reg_no' => $validated['reg_no'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'class_id' => $validated['class_id'],
                'batch_id' => $validated['batch_id'],
                'section_id' => $validated['section_id'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'status' => $validated['status'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student enrolled successfully.',
                'data' => $student->load(['schoolClass', 'batch', 'section']),
            ], 201);
        });
    }

    /**
     * Show student profile and performance summary.
     */
    public function show(string $id)
    {
        $student = Student::with(['schoolClass', 'batch', 'section', 'results.exam.subject'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $student,
        ]);
    }

    /**
     * Update an existing student record.
     */
    public function update(Request $request, string $id)
    {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'student_uid' => ['required', 'string', 'max:50', Rule::unique('students')->ignore($student->id)],
            'roll_no' => 'required|string|max:50',
            'reg_no' => ['required', 'string', 'max:50', Rule::unique('students')->ignore($student->id)],
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'class_id' => 'required|exists:classes,id',
            'batch_id' => 'required|exists:batches,id',
            'section_id' => 'nullable|exists:sections,id',
            'phone' => 'nullable|string|max:30',
            'email' => ['nullable', 'email', 'max:150', Rule::unique('students')->ignore($student->id)],
            'status' => 'required|in:active,inactive',
        ]);

        $student->update($validated);

        if ($student->user) {
            $student->user->update([
                'name' => "{$student->first_name} {$student->last_name}",
                'email' => $student->email ?? $student->user->email,
                'phone' => $student->phone,
                'status' => $student->status,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Student record updated.',
            'data' => $student->fresh(['schoolClass', 'batch', 'section']),
        ]);
    }

    /**
     * Delete or deactivate student.
     */
    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);

        // Check if student has exam scans or results
        if ($student->results()->exists() || $student->scans()->exists()) {
            $student->update(['status' => 'inactive']);
            return response()->json([
                'success' => true,
                'message' => 'Student has existing examination records and has been deactivated instead of permanently deleted.',
            ]);
        }

        $student->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student deleted successfully.',
        ]);
    }

    /**
     * Get examination history for this student.
     */
    public function results(string $id)
    {
        $student = Student::findOrFail($id);

        $results = $student->results()
            ->with(['exam.subject', 'exam.schoolClass'])
            ->orderByDesc('created_at')
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
     * Import students from CSV.
     */
    public function importCsv(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
            'class_id' => 'required|exists:classes,id',
            'batch_id' => 'required|exists:batches,id',
        ]);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $imported = 0;
        $errors = [];

        while (($row = fgetcsv($handle)) !== false) {
            // Expected headers: student_uid, roll_no, reg_no, first_name, last_name, phone, email
            if (count($row) < 5) continue;

            $stdUid = trim($row[0]);
            $roll = trim($row[1]);
            $reg = trim($row[2]);
            $first = trim($row[3]);
            $last = trim($row[4]);
            $phone = isset($row[5]) ? trim($row[5]) : null;
            $email = isset($row[6]) ? trim($row[6]) : null;

            if (empty($stdUid) || empty($roll) || empty($reg)) continue;

            try {
                Student::updateOrCreate(
                    ['student_uid' => $stdUid],
                    [
                        'roll_no' => $roll,
                        'reg_no' => $reg,
                        'first_name' => $first,
                        'last_name' => $last,
                        'class_id' => $request->class_id,
                        'batch_id' => $request->batch_id,
                        'phone' => $phone,
                        'email' => $email,
                        'status' => 'active',
                    ]
                );
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row for Student UID {$stdUid}: " . $e->getMessage();
            }
        }
        fclose($handle);

        return response()->json([
            'success' => true,
            'message' => "Successfully imported {$imported} students.",
            'errors' => $errors,
        ]);
    }

    /**
     * Export student roster as CSV.
     */
    public function exportCsv(Request $request)
    {
        $query = Student::with(['schoolClass', 'batch', 'section']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->filled('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }

        $students = $query->orderBy('roll_no')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="smartomr_students_' . date('Ymd_His') . '.csv"',
        ];

        $callback = function () use ($students) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Student UID', 'Roll No', 'Registration No', 'First Name', 'Last Name', 'Class', 'Batch', 'Section', 'Email', 'Phone', 'Status']);

            foreach ($students as $s) {
                fputcsv($file, [
                    $s->student_uid,
                    $s->roll_no,
                    $s->reg_no,
                    $s->first_name,
                    $s->last_name,
                    $s->schoolClass?->name ?? '',
                    $s->batch?->name ?? '',
                    $s->section?->name ?? '',
                    $s->email ?? '',
                    $s->phone ?? '',
                    $s->status,
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

