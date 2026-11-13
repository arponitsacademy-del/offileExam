<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_uid',
        'roll_no',
        'reg_no',
        'first_name',
        'last_name',
        'class_id',
        'batch_id',
        'section_id',
        'phone',
        'email',
        'photo_path',
        'status',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
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

