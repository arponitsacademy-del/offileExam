<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResultAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'result_id',
        'question_number',
        'student_answer',
        'correct_answer',
        'is_correct',
        'is_wrong',
        'is_blank',
        'is_invalid',
        'score_awarded',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'is_wrong' => 'boolean',
        'is_blank' => 'boolean',
        'is_invalid' => 'boolean',
        'score_awarded' => 'decimal:2',
    ];

    public function result()
    {
        return $this->belongsTo(Result::class);
    }
}

