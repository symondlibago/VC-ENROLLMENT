<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'subject_code',
        'descriptive_title',
        'lec_hrs',
        'lab_hrs',
        'total_units',
        'year',
        'semester',
        'course_id',
        'number_of_hours',
        'pre_req',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'lec_hrs' => 'float',
        'lab_hrs' => 'float',
        'total_units' => 'float',
        'number_of_hours' => 'float',
        'course_id' => 'integer',
        'pre_req' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the course that owns the subject.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the schedules for the subject.
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function students()
    {
        return $this->belongsToMany(\App\Models\PreEnrolledStudent::class, 'student_subject', 'subject_id', 'pre_enrolled_student_id')
                    ->withPivot('status') 
                    ->withTimestamps();
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}