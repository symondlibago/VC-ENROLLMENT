<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'pre_enrolled_student_id',
        'subject_id',
        'instructor_id',
        // The term and section this grade was earned in. Kept on the grade row
        // itself so re-enrollment (which re-syncs the student's subjects and
        // sections) can never orphan it.
        'section_id',
        'school_year',
        'semester',
        'year',
        'prelim_grade',
        'midterm_grade',
        'semifinal_grade',
        'final_grade',
        'status',
    ];

    protected $casts = [
        'prelim_grade' => 'float',
        'midterm_grade' => 'float',
        'semifinal_grade' => 'float',
        'final_grade' => 'float',
    ];

    public function student()
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function instructor()
    {
        return $this->belongsTo(Instructor::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }
}