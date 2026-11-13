<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScanReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'scan_id',
        'reviewer_id',
        'question_number',
        'previous_option',
        'revised_option',
        'revised_status',
        'comment',
    ];

    public function scan()
    {
        return $this->belongsTo(OmrScan::class, 'scan_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}

