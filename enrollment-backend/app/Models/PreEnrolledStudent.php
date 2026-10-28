<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;

class PreEnrolledStudent extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id_number',
        'original_student_id',
        'user_id',
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
        'fb_acc',
        'fb_description',
        'referral_source',
        'referral_source_other',
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
        'scholarship',
        'enrollment_status',
        'id_status', 
        'id_printed_at',
        'id_released_at', 
        'academic_status',
        // The acknowledgement they accepted when they submitted the form, and
        // which wording it was. Set by the controller, never by the request.
        'acknowledgement_accepted_at',
        'acknowledgement_version',
        'enrolled_notified_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'acknowledgement_accepted_at' => 'datetime',
        'enrolled_notified_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($student) {
            if (!$student->student_id_number) {
                
                $prefix = date('Y'); // e.g., '2025'

                $lastKnownNumber = 2224;
                $lastStudent = self::orderByRaw('CAST(SUBSTRING_INDEX(student_id_number, "-", -1) AS UNSIGNED) DESC')
                                    ->first();

                $nextNumber = $lastKnownNumber + 1; 

                if ($lastStudent) {
                    $lastIdParts = explode('-', $lastStudent->student_id_number);
                    
                    if (count($lastIdParts) === 2) {
                        $lastNumberInDb = (int)$lastIdParts[1];
                        if ($lastNumberInDb > $lastKnownNumber) {
                            $nextNumber = $lastNumberInDb + 1;
                        }
                    }
                }
                $student->student_id_number = $prefix . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
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
    
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'student_subject', 'pre_enrolled_student_id', 'subject_id')
                    ->withPivot('status') 
                    ->withTimestamps();
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

    public function sections(): BelongsToMany
    {
    return $this->belongsToMany(Section::class, 'section_student');
    }

    public function uploadReceipts(): HasMany
    {
        return $this->hasMany(UploadReceipt::class);
    }

    public function subjectChangeRequests(): HasMany
    {
    return $this->hasMany(SubjectChangeRequest::class, 'pre_enrolled_student_id');
    }

    public function shifteeRequests(): HasMany
    {
        return $this->hasMany(ShifteeRequest::class, 'pre_enrolled_student_id');
    }
    
    public function isShiftee(): bool
    {
        return $this->shifteeRequests()->where('status', 'approved')->exists();
    }

    public function grades()
    {
        return $this->hasMany(Grade::class, 'pre_enrolled_student_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Every physical ID card this student has been given, across all years. */
    public function idCards(): HasMany
    {
        return $this->hasMany(IdCardIssuance::class, 'pre_enrolled_student_id');
    }

    /** One clearance per term enrolled: per semester, or per year for SHS. */
    public function clearances(): HasMany
    {
        return $this->hasMany(Clearance::class, 'pre_enrolled_student_id');
    }

    /** True for Senior High, which clears once for the whole school year. */
    public function isSeniorHigh(): bool
    {
        return ($this->course?->program?->program_code) === 'SHS';
    }

    public function enrollmentHistories(): HasMany
    {
    return $this->hasMany(EnrollmentHistory::class);
    }


}