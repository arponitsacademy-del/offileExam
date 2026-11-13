<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\Exam;
use App\Models\OmrScan;
use App\Models\Result;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Database\Seeders\DatabaseSeeder;

class OmrEndToEndScanTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed database
        $this->seed(DatabaseSeeder::class);
    }

    public function test_complete_omr_scanning_and_evaluation_pipeline(): void
    {
        $teacher = User::where('role', 'teacher')->first();
        $exam = Exam::where('exam_code', 'PHY-MID-2026')->first();
        $student = Student::first();

        // Write synthetic image directly within workspace storage
        $testImagePath = storage_path('framework/testing/test_omr_synthetic.jpg');
        $pythonPath = base_path('../python311/python.exe');

        $cmd = sprintf(
            '"%s" -c "import sys; sys.path.insert(0, \'../omr-engine\'); import cv2; from tests.test_omr import generate_synthetic_omr_sheet; sheet, _ = generate_synthetic_omr_sheet(\'omr_25_v1\'); cv2.imwrite(r\'%s\', sheet)"',
            $pythonPath,
            $testImagePath
        );
        exec($cmd);

        $file = new UploadedFile(
            $testImagePath,
            'test_sheet.jpg',
            'image/jpeg',
            null,
            true
        );

        $response = $this->actingAs($teacher)
            ->call('POST', '/api/omr/scan', [
                'exam_id' => $exam->id,
                'student_id' => $student->id,
            ], [], ['image' => $file]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify Database records
        $scan = OmrScan::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        $this->assertNotNull($scan);
        $this->assertNotEmpty($scan->answers);

        // Q1 and Q2 are detected options
        $q1 = $scan->answers()->where('question_number', 1)->first();
        $this->assertEquals('A', $q1->detected_option);

        $q2 = $scan->answers()->where('question_number', 2)->first();
        $this->assertEquals('B', $q2->detected_option);

        // Verify Result record
        $result = Result::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        $this->assertNotNull($result);
        $this->assertEquals($exam->id, $result->exam_id);
        $this->assertGreaterThan(0, $result->answers()->count());

        @unlink($testImagePath);
    }
}
