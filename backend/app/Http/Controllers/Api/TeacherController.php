<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $teachers = Teacher::with('user')->orderBy('employee_id')->get();

        return response()->json([
            'success' => true,
            'data' => $teachers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:6',
            'employee_id' => 'required|string|max:50|unique:teachers,employee_id',
            'designation' => 'required|string|max:100',
            'department' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
        ]);

        return DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'teacher',
                'phone' => $validated['phone'] ?? null,
                'status' => 'active',
            ]);

            $teacher = Teacher::create([
                'user_id' => $user->id,
                'employee_id' => $validated['employee_id'],
                'designation' => $validated['designation'],
                'department' => $validated['department'],
                'phone' => $validated['phone'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Teacher account created.',
                'data' => $teacher->load('user'),
            ], 201);
        });
    }

    public function show(string $id)
    {
        $teacher = Teacher::with(['user', 'user.createdExams'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $teacher,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $teacher = Teacher::with('user')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => ['required', 'email', 'max:150', Rule::unique('users')->ignore($teacher->user_id)],
            'employee_id' => ['required', 'string', 'max:50', Rule::unique('teachers')->ignore($teacher->id)],
            'designation' => 'required|string|max:100',
            'department' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:6',
        ]);

        $teacher->update([
            'employee_id' => $validated['employee_id'],
            'designation' => $validated['designation'],
            'department' => $validated['department'],
            'phone' => $validated['phone'] ?? null,
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ];
        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }
        $teacher->user->update($userData);

        return response()->json([
            'success' => true,
            'message' => 'Teacher details updated.',
            'data' => $teacher->fresh('user'),
        ]);
    }

    public function destroy(string $id)
    {
        $teacher = Teacher::with('user')->findOrFail($id);
        $teacher->user->update(['status' => 'inactive']);

        return response()->json([
            'success' => true,
            'message' => 'Teacher deactivated.',
        ]);
    }
}

