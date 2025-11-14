<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'pre_enrolled_student_id',
        'enrollment_code_id',
        'previous_account',
        'registration_fee',
        'tuition_fee',
        'laboratory_fee',
        'miscellaneous_fee',
        'other_fees',
        'bundled_program_fee',
        'total_amount',
        'payment_amount',
        'discount',
        'discount_deduction',
        'remaining_amount',
        'term_payment',
        'payment_date',
        'advance_payment',
    ];

    public function preEnrolledStudent()
    {
        return $this->belongsTo(PreEnrolledStudent::class);
    }

    public function enrollmentCode()
    {
        return $this->belongsTo(EnrollmentCode::class);
    }

    public function termPayments(): HasMany
    {
        return $this->hasMany(TermPayment::class);
    }
}
