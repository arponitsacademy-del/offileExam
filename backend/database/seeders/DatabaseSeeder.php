<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Teacher;
use App\Models\SchoolClass;
use App\Models\Batch;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\OmrTemplate;
use App\Models\Exam;
use App\Models\ExamAssignment;
use App\Models\ExamAnswerKey;
use App\Models\AnswerKeyItem;
use App\Models\SystemSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. System Settings
        SystemSetting::set('institution_name', 'Apex Model International Academy', 'general', 'Name of the educational institution');
        SystemSetting::set('academic_year', '2026-2027', 'general', 'Current academic year');
        SystemSetting::set('default_marks_per_question', '1.00', 'omr', 'Default marks awarded for correct answer');
        SystemSetting::set('default_negative_marks', '0.25', 'omr', 'Default penalty deduction for incorrect answer');
        SystemSetting::set('bubble_fill_threshold', '0.45', 'omr', 'Black pixel density threshold to consider a bubble filled');
        SystemSetting::set('bubble_uncertain_threshold', '0.15', 'omr', 'Threshold difference to flag ambiguity between top options');

        // 2. Users: Super Admin, Teacher, Student
        $admin = User::firstOrCreate(
            ['email' => 'admin@smartomr.edu'],
            [
                'name' => 'Chief Administrator',
                'password' => Hash::make('Admin@123456'),
                'role' => 'super_admin',
                'phone' => '+1-555-0199',
                'status' => 'active',
            ]
        );

        $teacherUser = User::firstOrCreate(
            ['email' => 'teacher@smartomr.edu'],
            [
                'name' => 'Dr. Alan Vance',
                'password' => Hash::make('Teacher@123456'),
                'role' => 'teacher',
                'phone' => '+1-555-0142',
                'status' => 'active',
            ]
        );

        $teacher = Teacher::firstOrCreate(
            ['user_id' => $teacherUser->id],
            [
                'employee_id' => 'EMP-T-1001',
                'designation' => 'Senior Physics Professor',
                'department' => 'Science & Technology',
                'phone' => '+1-555-0142',
            ]
        );

        // 3. Classes
        $class1 = SchoolClass::firstOrCreate(
            ['code' => 'HSC-2027'],
            [
                'name' => 'HSC Class of 2027',
                'description' => 'Higher Secondary Certificate Examination Batch 2027',
                'status' => 'active',
            ]
        );

        $class2 = SchoolClass::firstOrCreate(
            ['code' => 'GRADE-10'],
            [
                'name' => 'Grade 10 Senior Secondary',
                'description' => 'Secondary School Certificate Class',
                'status' => 'active',
            ]
        );

        // 4. Batches
        $batch1 = Batch::firstOrCreate(
            ['class_id' => $class1->id, 'name' => 'Science Alpha'],
            [
                'session' => '2026-2027',
                'max_students' => 80,
                'status' => 'active',
            ]
        );

        $batch2 = Batch::firstOrCreate(
            ['class_id' => $class1->id, 'name' => 'Science Beta'],
            [
                'session' => '2026-2027',
                'max_students' => 80,
                'status' => 'active',
            ]
        );

        // 5. Sections
        $sec1 = Section::firstOrCreate(
            ['batch_id' => $batch1->id, 'name' => 'Morning Shift'],
            ['room_no' => 'Lab 301']
        );

        $sec2 = Section::firstOrCreate(
            ['batch_id' => $batch1->id, 'name' => 'Day Shift'],
            ['room_no' => 'Room 405']
        );

        // 6. Students
        $studentsData = [
            ['std_uid' => 'STD-2026-001', 'roll' => '101', 'reg' => 'REG-9001', 'first' => 'Aarav', 'last' => 'Patel', 'email' => 'student@smartomr.edu', 'pass' => 'Student@123456'],
            ['std_uid' => 'STD-2026-002', 'roll' => '102', 'reg' => 'REG-9002', 'first' => 'Sophia', 'last' => 'Chen', 'email' => 'sophia.chen@smartomr.edu', 'pass' => 'Student@123456'],
            ['std_uid' => 'STD-2026-003', 'roll' => '103', 'reg' => 'REG-9003', 'first' => 'Marcus', 'last' => 'Johnson', 'email' => 'marcus.j@smartomr.edu', 'pass' => 'Student@123456'],
            ['std_uid' => 'STD-2026-004', 'roll' => '104', 'reg' => 'REG-9004', 'first' => 'Fatima', 'last' => 'Al-Zahra', 'email' => 'fatima.z@smartomr.edu', 'pass' => 'Student@123456'],
            ['std_uid' => 'STD-2026-005', 'roll' => '105', 'reg' => 'REG-9005', 'first' => 'Liam', 'last' => 'O\'Connor', 'email' => 'liam.oc@smartomr.edu', 'pass' => 'Student@123456'],
        ];

        foreach ($studentsData as $st) {
            $user = User::firstOrCreate(
                ['email' => $st['email']],
                [
                    'name' => "{$st['first']} {$st['last']}",
                    'password' => Hash::make($st['pass']),
                    'role' => 'student',
                    'status' => 'active',
                ]
            );

            Student::firstOrCreate(
                ['student_uid' => $st['std_uid']],
                [
                    'user_id' => $user->id,
                    'roll_no' => $st['roll'],
                    'reg_no' => $st['reg'],
                    'first_name' => $st['first'],
                    'last_name' => $st['last'],
                    'class_id' => $class1->id,
                    'batch_id' => $batch1->id,
                    'section_id' => $sec1->id,
                    'email' => $st['email'],
                    'phone' => '+1-555-' . rand(1000, 9999),
                    'status' => 'active',
                ]
            );
        }

        // 7. Subjects
        $subPhysics = Subject::firstOrCreate(
            ['code' => 'PHY-101'],
            ['name' => 'Physics: Classical Mechanics & Waves', 'description' => 'Fundamental Newtonian mechanics, energy conservation and wave optics']
        );
        $subChem = Subject::firstOrCreate(
            ['code' => 'CHE-101'],
            ['name' => 'Chemistry: Atomic Theory & Bonding', 'description' => 'Inorganic reaction kinetics and molecular orbital structure']
        );
        $subMath = Subject::firstOrCreate(
            ['code' => 'MTH-101'],
            ['name' => 'Mathematics: Calculus & Linear Algebra', 'description' => 'Differential equations, matrix theory and vector calculus']
        );

        // 8. OMR Templates (Standard 20, 25, 50, 100 questions)
        $templates = [
            [
                'code' => 'omr_20_v1',
                'name' => 'Standard 20-Question 2-Column Template',
                'total_questions' => 20,
                'options_per_question' => 4,
                'columns_count' => 2,
                'layout_config' => [
                    'grid_dimensions' => ['rows_per_col' => 10, 'cols' => 2],
                    'questions_per_column' => 10,
                    'options' => ['A', 'B', 'C', 'D'],
                    'sheet_aspect_ratio' => 1.414, // A4
                    'marker_ratio' => 0.05,
                ],
                'qr_position' => ['top_left_ratio' => [0.75, 0.05], 'size_ratio' => [0.20, 0.12]]
            ],
            [
                'code' => 'omr_25_v1',
                'name' => 'Standard 25-Question Single Column Template',
                'total_questions' => 25,
                'options_per_question' => 4,
                'columns_count' => 1,
                'layout_config' => [
                    'grid_dimensions' => ['rows_per_col' => 25, 'cols' => 1],
                    'questions_per_column' => 25,
                    'options' => ['A', 'B', 'C', 'D'],
                    'sheet_aspect_ratio' => 1.414,
                    'marker_ratio' => 0.05,
                ],
                'qr_position' => ['top_left_ratio' => [0.75, 0.05], 'size_ratio' => [0.20, 0.12]]
            ],
            [
                'code' => 'omr_50_v1',
                'name' => 'Standard 50-Question 2-Column Template',
                'total_questions' => 50,
                'options_per_question' => 4,
                'columns_count' => 2,
                'layout_config' => [
                    'grid_dimensions' => ['rows_per_col' => 25, 'cols' => 2],
                    'questions_per_column' => 25,
                    'options' => ['A', 'B', 'C', 'D'],
                    'sheet_aspect_ratio' => 1.414,
                    'marker_ratio' => 0.05,
                ],
                'qr_position' => ['top_left_ratio' => [0.75, 0.05], 'size_ratio' => [0.20, 0.12]]
            ],
            [
                'code' => 'omr_100_v1',
                'name' => 'Standard 100-Question 4-Column Template',
                'total_questions' => 100,
                'options_per_question' => 4,
                'columns_count' => 4,
                'layout_config' => [
                    'grid_dimensions' => ['rows_per_col' => 25, 'cols' => 4],
                    'questions_per_column' => 25,
                    'options' => ['A', 'B', 'C', 'D'],
                    'sheet_aspect_ratio' => 1.414,
                    'marker_ratio' => 0.05,
                ],
                'qr_position' => ['top_left_ratio' => [0.75, 0.05], 'size_ratio' => [0.20, 0.12]]
            ],
        ];

        foreach ($templates as $t) {
            OmrTemplate::firstOrCreate(
                ['code' => $t['code']],
                $t
            );
        }

        $template25 = OmrTemplate::where('code', 'omr_25_v1')->first();
        $template50 = OmrTemplate::where('code', 'omr_50_v1')->first();

        // 9. Demo Exams
        $exam1 = Exam::firstOrCreate(
            ['exam_code' => 'PHY-MID-2026'],
            [
                'title' => 'Physics Mid-Term Assessment 2026',
                'description' => 'Comprehensive midterm multiple choice evaluation covering kinematics and electrostatics.',
                'subject_id' => $subPhysics->id,
                'class_id' => $class1->id,
                'created_by' => $teacherUser->id,
                'template_id' => $template25->id,
                'exam_date' => now()->toDateString(),
                'duration_minutes' => 45,
                'total_questions' => 25,
                'marks_per_question' => 1.00,
                'negative_marks_per_question' => 0.25,
                'passing_marks' => 10.00,
                'invalid_marking_penalty' => 0.00,
                'status' => 'active',
                'allow_multiple_attempts' => false,
            ]
        );

        ExamAssignment::firstOrCreate([
            'exam_id' => $exam1->id,
            'batch_id' => $batch1->id,
        ]);

        // 10. Answer Key for Exam 1 (25 questions)
        $answerKey1 = ExamAnswerKey::firstOrCreate(
            ['exam_id' => $exam1->id, 'version' => 1],
            [
                'is_active' => true,
                'created_by' => $teacherUser->id,
                'change_reason' => 'Initial verified answer key',
            ]
        );

        $defaultOptions = ['A', 'B', 'C', 'D'];
        for ($q = 1; $q <= 25; $q++) {
            // A pattern like A, B, C, D, A, B...
            $correct = $defaultOptions[($q - 1) % 4];
            AnswerKeyItem::firstOrCreate(
                ['answer_key_id' => $answerKey1->id, 'question_number' => $q],
                [
                    'correct_option' => $correct,
                    'marks_weight' => 1.00,
                    'is_bonus' => false,
                ]
            );
        }
    }
}
