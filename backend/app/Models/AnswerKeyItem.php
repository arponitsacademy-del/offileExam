<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnswerKeyItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'answer_key_id',
        'question_number',
        'correct_option',
        'marks_weight',
        'is_bonus',
    ];

    protected $casts = [
        'marks_weight' => 'decimal:2',
        'is_bonus' => 'boolean',
    ];

    public function answerKey()
    {
        return $this->belongsTo(ExamAnswerKey::class, 'answer_key_id');
    }
}

