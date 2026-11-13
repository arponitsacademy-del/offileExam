<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OmrScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'scan_uid',
        'exam_id',
        'student_id',
        'omr_sheet_id',
        'original_image_path',
        'processed_image_path',
        'scanned_by',
        'status',
        'alignment_confidence',
        'qr_detected',
        'qr_payload',
        'raw_engine_response',
        'review_status',
        'error_message',
    ];

    protected $casts = [
        'qr_detected' => 'boolean',
        'alignment_confidence' => 'decimal:2',
        'raw_engine_response' => 'array',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function omrSheet()
    {
        return $this->belongsTo(OmrSheet::class);
    }

    public function scanner()
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }

    public function answers()
    {
        return $this->hasMany(ScanAnswer::class, 'scan_id')->orderBy('question_number');
    }

    public function reviews()
    {
        return $this->hasMany(ScanReview::class, 'scan_id');
    }

    public function result()
    {
        return $this->hasOne(Result::class, 'scan_id');
    }
}

