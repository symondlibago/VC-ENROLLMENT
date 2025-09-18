<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PreEnrolledStudent extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'last_name',
        'first_name',
        'middle_name',
        'gender',
        'birth_date',
        'birth_place',
        'nationality',
        'civil_status',
        'religion',
        'address',
        'contact_number',
        'email_address',
        'father_name',
        'father_occupation',
        'father_contact_number',
        'mother_name',
        'mother_occupation',
        'mother_contact_number',
        'parents_address',
        'emergency_contact_name',
        'emergency_contact_number',
        'emergency_contact_address',
        'elementary',
        'elementary_date_completed',
        'junior_high_school',
        'junior_high_date_completed',
        'senior_high_school',
        'senior_high_date_completed',
        'high_school_non_k12',
        'high_school_non_k12_date_completed',
        'college',
        'college_date_completed',
        'id_photo',
        'signature',
        'semester',
        'school_year',
        'year',
        'enrollment_type',
        'selected_subjects',
        'program_head_approved',
        'registrar_approved',
        'cashier_approved'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birth_date' => 'date',
        'selected_subjects' => 'array',
        'program_head_approved' => 'boolean',
        'registrar_approved' => 'boolean',
        'cashier_approved' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($student) {
            $currentYear = date('Y');
            
            $lastStudentOfTheYear = self::where('student_id_number', 'like', $currentYear . '-%')
                                        ->orderBy('id', 'desc')
                                        ->first();
            
            $nextNumber = 1;
            if ($lastStudentOfTheYear) {
                $lastNumber = (int) substr($lastStudentOfTheYear->student_id_number, 5);
                $nextNumber = $lastNumber + 1;
            }
            
            $student->student_id_number = $currentYear . '-' . $nextNumber;
        });
    }

    /**
     * Get the course that the student is enrolling in.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the enrollment code associated with the pre-enrolled student.
     */
    public function enrollmentCode(): HasOne
    {
        return $this->hasOne(EnrollmentCode::class);
    }

    /**
     * Get the full name of the student.
     *
     * @return string
     */
    public function getFullNameAttribute(): string
    {
        return $this->last_name . ', ' . $this->first_name . ' ' . ($this->middle_name ? $this->middle_name : '');
    }

    /**
     * Check if the enrollment is fully approved.
     *
     * @return bool
     */
    public function isFullyApproved(): bool
    {
        return $this->program_head_approved && $this->registrar_approved && $this->cashier_approved;
    }
}