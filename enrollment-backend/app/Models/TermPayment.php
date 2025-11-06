<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TermPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'pre_enrolled_student_id',
        'or_number',
        'amount',
        'payment_date',
    ];

    /**
     * Get the main payment record this term payment belongs to.
     */
    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}