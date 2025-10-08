<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnrollmentHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'pre_enrolled_student_id',
        'course_id',
        'semester',
        'school_year',
        'year',
        'enrollment_type',
        'academic_status',
        'subjects_taken',
    ];

    // Cast the 'subjects_taken' JSON column to a PHP array automatically
    protected $casts = [
        'subjects_taken' => 'array',
    ];

    public function student()
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }
}