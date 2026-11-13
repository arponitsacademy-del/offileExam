<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamAnswerKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'version',
        'is_active',
        'created_by',
        'change_reason',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(AnswerKeyItem::class, 'answer_key_id')->orderBy('question_number');
    }
}

