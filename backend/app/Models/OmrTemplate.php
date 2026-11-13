<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OmrTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'total_questions',
        'options_per_question',
        'columns_count',
        'layout_config',
        'qr_position',
        'is_active',
    ];

    protected $casts = [
        'layout_config' => 'array',
        'qr_position' => 'array',
        'is_active' => 'boolean',
    ];

    public function exams()
    {
        return $this->hasMany(Exam::class, 'template_id');
    }
}

