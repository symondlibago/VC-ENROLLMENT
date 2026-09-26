<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'pre_enrolled_student_id', 'subject_id', 'grade_id', 'instructor_id', 'section_id',
        'school_year', 'semester', 'year', 'status',
        'amount', 'or_number', 'payment_date',
        'cashier_approved_at', 'cashier_approved_by', 'cashier_remarks',
        'instructor_approved_at', 'instructor_approved_by', 'instructor_remarks',
        'program_head_approved_at', 'program_head_approved_by', 'program_head_remarks',
        'registrar_approved_at', 'registrar_approved_by', 'registrar_remarks',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'cashier_approved_at' => 'datetime',
        'instructor_approved_at' => 'datetime',
        'program_head_approved_at' => 'datetime',
        'registrar_approved_at' => 'datetime',
    ];

    /** The four approvals, in the order they are collected. */
    public const APPROVAL_STEPS = ['cashier', 'instructor', 'program_head', 'registrar'];

    public function student()
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function instructor()
    {
        return $this->belongsTo(Instructor::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function isFullyApproved(): bool
    {
        return $this->cashier_approved_at
            && $this->instructor_approved_at
            && $this->program_head_approved_at
            && $this->registrar_approved_at;
    }

    /**
     * Keeps `status` in step with the approvals:
     * awaiting_payment → processing (paid) → completed (all four approvals in).
     */
    public function refreshStatus(): void
    {
        if ($this->status === 'cancelled') {
            return;
        }

        if ($this->isFullyApproved()) {
            $this->status = 'completed';
        } elseif ($this->cashier_approved_at) {
            $this->status = 'processing';
        } else {
            $this->status = 'awaiting_payment';
        }
    }
}
