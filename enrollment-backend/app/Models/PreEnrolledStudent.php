<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PreEnrolledStudent extends Model
{
    use HasFactory;

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
        'enrollment_status',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'selected_subjects' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($student) {
            if (!$student->student_id_number) {
                $currentYear = date('Y');
                $lastStudentOfTheYear = self::whereYear('created_at', $currentYear)
                                            ->orderBy('id', 'desc')
                                            ->first();
                
                $nextNumber = 1;
                if ($lastStudentOfTheYear) {
                    $lastIdParts = explode('-', $lastStudentOfTheYear->student_id_number);
                    $lastNumber = end($lastIdParts);
                    if (is_numeric($lastNumber)) {
                        $nextNumber = (int)$lastNumber + 1;
                    }
                }
                
                $student->student_id_number = $currentYear . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function enrollmentCode(): HasOne
    {
        return $this->hasOne(EnrollmentCode::class);
    }
    
    public function enrollmentApprovals(): HasMany
    {
        return $this->hasMany(EnrollmentApproval::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->last_name}, {$this->first_name} " . ($this->middle_name ? $this->middle_name[0] . '.' : '');
    }

    public function getApprovalStatusFor(string $role): ?EnrollmentApproval
    {
        return $this->enrollmentApprovals->firstWhere('role', $role);
    }

    public function isFullyApproved(): bool
    {
        return $this->enrollment_status === 'enrolled';
    }
}

