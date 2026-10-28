<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Stock going out — a sling or holder handed to a student.
 *
 * Usually it goes out with a card, in which case it points at that issuance.
 * A student replacing only a snapped sling has no card record to point at, so
 * the link is optional and the student is kept either way.
 */
class IdSupplyIssuance extends Model
{
    protected $fillable = [
        'id_supply_item_id',
        'id_card_issuance_id',
        'pre_enrolled_student_id',
        'school_year',
        'issued_on',
        'quantity',
        'reason',
        'amount',
        'or_number',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'issued_on' => 'date',
        'quantity' => 'integer',
        'amount' => 'decimal:2',
    ];

    public const REASONS = ['with_id', 'replacement', 'sale', 'loss', 'adjustment'];

    public function item(): BelongsTo
    {
        return $this->belongsTo(IdSupplyItem::class, 'id_supply_item_id');
    }

    public function cardIssuance(): BelongsTo
    {
        return $this->belongsTo(IdCardIssuance::class, 'id_card_issuance_id');
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
