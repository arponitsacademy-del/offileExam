<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OmrSheet extends Model
{
    use HasFactory;

    protected $fillable = [
        'sheet_uid',
        'exam_id',
        'student_id',
        'status',
        'printed_at',
    ];

    protected $casts = [
        'printed_at' => 'datetime',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function scans()
    {
        return $this->hasMany(OmrScan::class);
    }
}

