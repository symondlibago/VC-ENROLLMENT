<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShifteeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'pre_enrolled_student_id',
        'previous_course_id',
        'new_course_id',
        'status',
        'rejection_remarks',
        'processed_by',
    ];

    public function student()
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function previousCourse()
    {
        return $this->belongsTo(Course::class, 'previous_course_id');
    }

    public function newCourse()
    {
        return $this->belongsTo(Course::class, 'new_course_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}