<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One physical ID card issued to a student in a school year.
 *
 * A replacement is a new record rather than an edit of the old one, so the
 * card that was lost stays on the student's history with the date it went.
 */
class IdCardIssuance extends Model
{
    protected $fillable = [
        'pre_enrolled_student_id',
        'school_year',
        'sequence',
        'reason',
        'status',
        'printed_at',
        'released_at',
        'reported_lost_at',
        'received_by',
        'fee',
        'or_number',
        'remarks',
        'printed_by',
        'released_by',
        'recorded_by',
    ];

    protected $casts = [
        'sequence' => 'integer',
        'printed_at' => 'datetime',
        'released_at' => 'datetime',
        'reported_lost_at' => 'datetime',
        'fee' => 'decimal:2',
    ];

    /** The status each card sits in, in the order it moves through them. */
    public const STATUSES = ['pending', 'printed', 'released', 'lost', 'voided'];

    /** Why this card was made. Anything but `initial` is a reprint. */
    public const REASONS = ['initial', 'lost', 'damaged', 'renewal', 'correction'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function supplyIssuances(): HasMany
    {
        return $this->hasMany(IdSupplyIssuance::class);
    }

    public function releaser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function printer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'printed_by');
    }

    public function scopeForYear($query, ?string $schoolYear)
    {
        return $schoolYear ? $query->where('school_year', $schoolYear) : $query;
    }

    /** A card still counted as the student's current one. */
    public function scopeLive($query)
    {
        return $query->whereNotIn('status', ['voided']);
    }

    /** The card label a user reads — "1st copy", "2nd copy". */
    public function getCopyLabelAttribute(): string
    {
        $suffix = match (true) {
            $this->sequence % 100 >= 11 && $this->sequence % 100 <= 13 => 'th',
            $this->sequence % 10 === 1 => 'st',
            $this->sequence % 10 === 2 => 'nd',
            $this->sequence % 10 === 3 => 'rd',
            default => 'th',
        };

        return $this->sequence . $suffix . ' copy';
    }
}
