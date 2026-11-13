<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScanAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'scan_id',
        'question_number',
        'detected_option',
        'fill_ratio_a',
        'fill_ratio_b',
        'fill_ratio_c',
        'fill_ratio_d',
        'status',
    ];

    protected $casts = [
        'fill_ratio_a' => 'decimal:2',
        'fill_ratio_b' => 'decimal:2',
        'fill_ratio_c' => 'decimal:2',
        'fill_ratio_d' => 'decimal:2',
    ];

    public function scan()
    {
        return $this->belongsTo(OmrScan::class, 'scan_id');
    }
}

