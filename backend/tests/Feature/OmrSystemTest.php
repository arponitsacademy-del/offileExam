<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Batch;
use App\Models\Subject;
use App\Models\OmrTemplate;
use App\Models\Exam;
use App\Models\ExamAnswerKey;
use App\Models\AnswerKeyItem;
use App\Models\OmrScan;
use App\Models\Result;
use App\Services\OmrEvaluationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class OmrSystemTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $teacherUser;
    protected User $studentUser;
    protected Student $student;
    protected Exam $exam;
    protected ExamAnswerKey $answerKey;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Users
        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $this->teacherUser = User::create([
            'name' => 'Teacher User',
            'email' => 'teacher@test.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'status' => 'active',
        ]);

        $this->studentUser = User::create([
            'name' => 'Student User',
            'email' => 'student@test.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'status' => 'active',
        ]);

        // 2. Academic structure
        $class = SchoolClass::create([
            'name' => 'Grade 12',
            'code' => 'GR-12',
            'status' => 'active',
        ]);

        $batch = Batch::create([
            'class_id' => $class->id,
            'name' => 'Science A',
            'max_students' => 50,
            'status' => 'active',
        ]);

        $this->student = Student::create([
            'user_id' => $this->studentUser->id,
            'student_uid' => 'STD-TEST-01',
            'roll_no' => '101',
            'reg_no' => 'REG-TEST-01',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'class_id' => $class->id,
            'batch_id' => $batch->id,
            'email' => 'student@test.com',
            'status' => 'active',
        ]);

        $subject = Subject::create([
            'name' => 'Physics',
            'code' => 'PHY-01',
        ]);

        $template = OmrTemplate::create([
            'code' => 'omr_20_v1',
            'name' => '20 Questions',
            'total_questions' => 20,
            'options_per_question' => 4,
            'columns_count' => 2,
        ]);

        $this->exam = Exam::create([
            'exam_code' => 'TEST-EXAM-01',
            'title' => 'Physics Diagnostic Test',
            'subject_id' => $subject->id,
            'class_id' => $class->id,
            'created_by' => $this->teacherUser->id,
            'template_id' => $template->id,
            'exam_date' => now()->toDateString(),
            'duration_minutes' => 30,
            'total_questions' => 20,
            'marks_per_question' => 1.00,
            'negative_marks_per_question' => 0.25,
            'passing_marks' => 8.00,
            'invalid_marking_penalty' => 0.00,
            'status' => 'active',
            'allow_multiple_attempts' => false,
        ]);

        // Active Answer Key: Q1-20 alternating A, B, C, D
        $this->answerKey = ExamAnswerKey::create([
            'exam_id' => $this->exam->id,
            'version' => 1,
            'is_active' => true,
            'created_by' => $this->teacherUser->id,
        ]);

        $opts = ['A', 'B', 'C', 'D'];
        for ($q = 1; $q <= 20; $q++) {
            AnswerKeyItem::create([
                'answer_key_id' => $this->answerKey->id,
                'question_number' => $q,
                'correct_option' => $opts[($q - 1) % 4],
                'marks_weight' => 1.00,
            ]);
        }
    }

    /**
     * Test Authentication & Token generation
     */
    public function test_user_can_login_and_receive_sanctum_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'email', 'role'],
                    'token',
                ]
            ]);
    }

    /**
     * Test Role-based Authorization
     */
    public function test_student_cannot_access_teacher_endpoints(): void
    {
        $response = $this->actingAs($this->studentUser)
            ->getJson('/api/exams');

        $response->assertStatus(403);
    }

    /**
     * Test Answer key management
     */
    public function test_teacher_can_fetch_answer_key(): void
    {
        $response = $this->actingAs($this->teacherUser)
            ->getJson("/api/exams/{$this->exam->id}/answer-key");

        $response->assertStatus(200)
            ->assertJsonPath('data.total_questions', 20)
            ->assertJsonPath('data.is_complete', true);
    }

    /**
     * Test Result Calculation and Negative Marking logic
     */
    public function test_omr_evaluation_service_calculates_scores_and_negative_marking(): void
    {
        $scan = OmrScan::create([
            'scan_uid' => 'SCN-TEST-100',
            'exam_id' => $this->exam->id,
            'student_id' => $this->student->id,
            'original_image_path' => 'dummy.jpg',
            'scanned_by' => $this->teacherUser->id,
            'status' => 'completed',
        ]);

        // Student responses:
        // Correct Key Q1-20: [A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D, A, B, C, D]
        // Student answers:
        // 10 Correct: Q1-Q10 match key
        // 4 Wrong: Q11-Q14 give wrong letter
        // 6 Blank: Q15-Q20 null
        $detected = [];
        $opts = ['A', 'B', 'C', 'D'];
        for ($q = 1; $q <= 10; $q++) {
            $detected[$q] = $opts[($q - 1) % 4];
        }
        for ($q = 11; $q <= 14; $q++) {
            $detected[$q] = 'A'; // Wrong for Q11, 12, 14
        }
        for ($q = 15; $q <= 20; $q++) {
            $detected[$q] = null;
        }

        $service = new OmrEvaluationService();
        $result = $service->evaluateScan($scan, $detected);

        // Expected score:
        // Correct count: Q1..Q10 are correct (10) + Q13 is 'A' which matches key for Q13 -> 11 correct
        // Q11 (correct C, given A) -> wrong
        // Q12 (correct D, given A) -> wrong
        // Q14 (correct B, given A) -> wrong
        // Wrong count = 3
        // Blank count = 6
        // Raw score = 11 * 1.0 = 11.0
        // Penalty = 3 * 0.25 = 0.75
        // Final score = 11.0 - 0.75 = 10.25
        $this->assertEquals(11, $result->correct_count);
        $this->assertEquals(3, $result->wrong_count);
        $this->assertEquals(6, $result->blank_count);
        $this->assertEquals(10.25, (float)$result->final_score);
        $this->assertTrue($result->is_passed); // Passing mark is 8.0
    }

    /**
     * Test Duplicate Submission Prevention
     */
    public function test_duplicate_submission_throws_exception_unless_confirmed(): void
    {
        $scan1 = OmrScan::create([
            'scan_uid' => 'SCN-DUPE-1',
            'exam_id' => $this->exam->id,
            'student_id' => $this->student->id,
            'original_image_path' => 'dummy1.jpg',
            'scanned_by' => $this->teacherUser->id,
            'status' => 'completed',
        ]);

        $service = new OmrEvaluationService();
        $service->evaluateScan($scan1, [1 => 'A', 2 => 'B']);

        // Attempt second scan for same student and exam
        $scan2 = OmrScan::create([
            'scan_uid' => 'SCN-DUPE-2',
            'exam_id' => $this->exam->id,
            'student_id' => $this->student->id,
            'original_image_path' => 'dummy2.jpg',
            'scanned_by' => $this->teacherUser->id,
            'status' => 'completed',
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("A finalized result already exists");
        $service->evaluateScan($scan2, [1 => 'A', 2 => 'B'], false);
    }

    /**
     * Test Result Publishing & Student Access
     */
    public function test_student_only_sees_published_results(): void
    {
        $scan = OmrScan::create([
            'scan_uid' => 'SCN-PUB-01',
            'exam_id' => $this->exam->id,
            'student_id' => $this->student->id,
            'original_image_path' => 'dummy.jpg',
            'scanned_by' => $this->teacherUser->id,
            'status' => 'completed',
        ]);

        $service = new OmrEvaluationService();
        $result = $service->evaluateScan($scan, [1 => 'A', 2 => 'B']);

        // 1. Result is finalized but NOT published yet
        $resBefore = $this->actingAs($this->studentUser)
            ->getJson('/api/student-portal/results');
        $resBefore->assertStatus(200)
            ->assertJsonCount(0, 'data.results');

        // 2. Teacher publishes results
        $this->actingAs($this->teacherUser)
            ->postJson("/api/exams/{$this->exam->id}/results/publish");

        // 3. Student can now view result
        $resAfter = $this->actingAs($this->studentUser)
            ->getJson('/api/student-portal/results');
        $resAfter->assertStatus(200)
            ->assertJsonCount(1, 'data.results');
    }
}

