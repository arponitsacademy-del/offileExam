<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Teachers
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('employee_id', 50)->unique();
            $table->string('designation', 100)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->timestamps();
        });

        // 2. Classes (Academic levels e.g. "HSC 2027", "Grade 10")
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });

        // 3. Batches (e.g. "Science A", "Commerce B")
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('session', 50)->nullable(); // e.g. "2026-2027"
            $table->integer('max_students')->default(100);
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->index(['class_id', 'status']);
        });

        // 4. Sections (e.g. "Morning", "Day")
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('room_no', 50)->nullable();
            $table->timestamps();
        });

        // 5. Students
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('student_uid', 50)->unique(); // Internal student code e.g. STD-001
            $table->string('roll_no', 50)->index();
            $table->string('reg_no', 50)->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('photo_path')->nullable();
            $table->string('status', 20)->default('active')->index(); // active, inactive
            $table->timestamps();
            $table->index(['batch_id', 'roll_no']);
        });

        // 6. Student Batch pivot (if students are enrolled in multiple batches/sessions)
        Schema::create('student_batch', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->string('roll_no', 50)->nullable();
            $table->timestamps();
            $table->unique(['student_id', 'batch_id']);
        });

        // 7. Subjects
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 8. OMR Templates
        Schema::create('omr_templates', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // e.g. "omr_20_v1", "omr_25_v1", "omr_50_v1", "omr_100_v1"
            $table->string('name', 100);
            $table->integer('total_questions');
            $table->integer('options_per_question')->default(4);
            $table->integer('columns_count')->default(2);
            $table->json('layout_config')->nullable(); // Coordinates, grid geometry, marker anchors
            $table->json('qr_position')->nullable(); // Bounding box for QR code
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 9. Exams
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('exam_code', 50)->unique();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('template_id')->constrained('omr_templates')->restrictOnDelete();
            $table->date('exam_date');
            $table->integer('duration_minutes')->default(60);
            $table->integer('total_questions');
            $table->decimal('marks_per_question', 8, 2)->default(1.00);
            $table->decimal('negative_marks_per_question', 8, 2)->default(0.25);
            $table->decimal('passing_marks', 8, 2)->default(20.00);
            $table->decimal('invalid_marking_penalty', 8, 2)->default(0.00);
            $table->string('status', 30)->default('draft')->index(); // draft, active, completed, published
            $table->boolean('allow_multiple_attempts')->default(false);
            $table->timestamps();
            $table->index(['created_by', 'status']);
            $table->index(['class_id', 'exam_date']);
        });

        // 10. Exam Assignments (to Batches)
        Schema::create('exam_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('batches')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['exam_id', 'batch_id']);
        });

        // 11. Exam Answer Keys (version controlled)
        Schema::create('exam_answer_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->integer('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->text('change_reason')->nullable();
            $table->timestamps();
            $table->unique(['exam_id', 'version']);
        });

        // 12. Answer Key Items
        Schema::create('answer_key_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('answer_key_id')->constrained('exam_answer_keys')->cascadeOnDelete();
            $table->integer('question_number');
            $table->string('correct_option', 5); // 'A', 'B', 'C', 'D'
            $table->decimal('marks_weight', 5, 2)->default(1.00);
            $table->boolean('is_bonus')->default(false);
            $table->timestamps();
            $table->unique(['answer_key_id', 'question_number']);
        });

        // 13. OMR Printable Sheets (pre-allocated with non-guessable sheet_uid for QR)
        Schema::create('omr_sheets', function (Blueprint $table) {
            $table->id();
            $table->string('sheet_uid', 64)->unique();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('status', 30)->default('generated'); // generated, scanned, re_scanned, invalidated
            $table->timestamp('printed_at')->nullable();
            $table->timestamps();
            $table->index(['exam_id', 'student_id']);
        });

        // 14. OMR Scan Records
        Schema::create('omr_scans', function (Blueprint $table) {
            $table->id();
            $table->string('scan_uid', 64)->unique();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->foreignId('omr_sheet_id')->nullable()->constrained('omr_sheets')->nullOnDelete();
            $table->string('original_image_path');
            $table->string('processed_image_path')->nullable();
            $table->foreignId('scanned_by')->constrained('users')->cascadeOnDelete();
            $table->string('status', 30)->default('processing'); // processing, completed, requires_review, rejected, failed
            $table->decimal('alignment_confidence', 5, 2)->nullable();
            $table->boolean('qr_detected')->default(false);
            $table->string('qr_payload')->nullable();
            $table->json('raw_engine_response')->nullable();
            $table->string('review_status', 30)->default('approved'); // pending, reviewed, approved, rejected
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->index(['exam_id', 'status']);
            $table->index(['student_id', 'exam_id']);
        });

        // 15. Scan Detected Answers
        Schema::create('scan_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_id')->constrained('omr_scans')->cascadeOnDelete();
            $table->integer('question_number');
            $table->string('detected_option', 5)->nullable(); // A, B, C, D or null
            $table->decimal('fill_ratio_a', 5, 2)->default(0);
            $table->decimal('fill_ratio_b', 5, 2)->default(0);
            $table->decimal('fill_ratio_c', 5, 2)->default(0);
            $table->decimal('fill_ratio_d', 5, 2)->default(0);
            $table->string('status', 30)->default('single'); // single, blank, multiple, uncertain
            $table->timestamps();
            $table->unique(['scan_id', 'question_number']);
        });

        // 16. Scan Manual Reviews
        Schema::create('scan_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_id')->constrained('omr_scans')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->integer('question_number');
            $table->string('previous_option', 5)->nullable();
            $table->string('revised_option', 5)->nullable();
            $table->string('revised_status', 30);
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->index(['scan_id', 'reviewer_id']);
        });

        // 17. Finalized Results
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('scan_id')->constrained('omr_scans')->cascadeOnDelete();
            $table->integer('total_questions');
            $table->integer('correct_count')->default(0);
            $table->integer('wrong_count')->default(0);
            $table->integer('blank_count')->default(0);
            $table->integer('multiple_marked_count')->default(0);
            $table->integer('uncertain_count')->default(0);
            $table->decimal('raw_score', 8, 2)->default(0);
            $table->decimal('penalty_score', 8, 2)->default(0);
            $table->decimal('final_score', 8, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->boolean('is_passed')->default(false);
            $table->integer('rank')->nullable();
            $table->string('status', 30)->default('draft')->index(); // draft, pending_review, finalized, published
            $table->timestamp('evaluated_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->unique(['exam_id', 'student_id']);
            $table->index(['exam_id', 'final_score']);
        });

        // 18. Result Answer Breakdown
        Schema::create('result_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('result_id')->constrained('results')->cascadeOnDelete();
            $table->integer('question_number');
            $table->string('student_answer', 5)->nullable();
            $table->string('correct_answer', 5);
            $table->boolean('is_correct')->default(false);
            $table->boolean('is_wrong')->default(false);
            $table->boolean('is_blank')->default(false);
            $table->boolean('is_invalid')->default(false);
            $table->decimal('score_awarded', 8, 2)->default(0);
            $table->timestamps();
            $table->unique(['result_id', 'question_number']);
        });

        // 19. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100);
            $table->string('entity_type', 100);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->index(['entity_type', 'entity_id']);
            $table->index(['user_id', 'action']);
        });

        // 20. System Settings
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('result_answers');
        Schema::dropIfExists('results');
        Schema::dropIfExists('scan_reviews');
        Schema::dropIfExists('scan_answers');
        Schema::dropIfExists('omr_scans');
        Schema::dropIfExists('omr_sheets');
        Schema::dropIfExists('answer_key_items');
        Schema::dropIfExists('exam_answer_keys');
        Schema::dropIfExists('exam_assignments');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('omr_templates');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('student_batch');
        Schema::dropIfExists('students');
        Schema::dropIfExists('sections');
        Schema::dropIfExists('batches');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('teachers');
    }
};

