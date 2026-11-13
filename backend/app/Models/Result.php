<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'student_id',
        'scan_id',
        'total_questions',
        'correct_count',
        'wrong_count',
        'blank_count',
        'multiple_marked_count',
        'uncertain_count',
        'raw_score',
        'penalty_score',
        'final_score',
        'percentage',
        'is_passed',
        'rank',
        'status',
        'evaluated_at',
        'published_at',
    ];

    protected $casts = [
        'is_passed' => 'boolean',
        'raw_score' => 'decimal:2',
        'penalty_score' => 'decimal:2',
        'final_score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'evaluated_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function scan()
    {
        return $this->belongsTo(OmrScan::class, 'scan_id');
    }

    public function answers()
    {
        return $this->hasMany(ResultAnswer::class, 'result_id')->orderBy('question_number');
    }
}

