<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One student's fabric purchase at the cashier, covered by one O.R. */
class FabricPurchase extends Model
{
    protected $fillable = [
        'pre_enrolled_student_id',
        'student_name',
        'student_id_number',
        'course',
        'year_level',
        'or_number',
        'purchase_date',
        'total_meters',
        'amount',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'total_meters' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(FabricPurchaseItem::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
