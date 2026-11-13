<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_code',
        'title',
        'description',
        'subject_id',
        'class_id',
        'created_by',
        'template_id',
        'exam_date',
        'duration_minutes',
        'total_questions',
        'marks_per_question',
        'negative_marks_per_question',
        'passing_marks',
        'invalid_marking_penalty',
        'status',
        'allow_multiple_attempts',
    ];

    protected $casts = [
        'exam_date' => 'date',
        'marks_per_question' => 'decimal:2',
        'negative_marks_per_question' => 'decimal:2',
        'passing_marks' => 'decimal:2',
        'invalid_marking_penalty' => 'decimal:2',
        'allow_multiple_attempts' => 'boolean',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function template()
    {
        return $this->belongsTo(OmrTemplate::class, 'template_id');
    }

    public function assignments()
    {
        return $this->hasMany(ExamAssignment::class);
    }

    public function batches()
    {
        return $this->belongsToMany(Batch::class, 'exam_assignments');
    }

    public function answerKeys()
    {
        return $this->hasMany(ExamAnswerKey::class);
    }

    public function activeAnswerKey()
    {
        return $this->hasOne(ExamAnswerKey::class)->where('is_active', true);
    }

    public function omrSheets()
    {
        return $this->hasMany(OmrSheet::class);
    }

    public function scans()
    {
        return $this->hasMany(OmrScan::class);
    }

    public function results()
    {
        return $this->hasMany(Result::class);
    }
}

