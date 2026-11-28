<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A term payment from before the system — typed up from the paper ledger.
 *
 * See the migration for why these are kept out of `payments`.
 */
class HistoricalTermPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_name',
        'course',
        'school_year',
        'semester',
        'paid_amount',
        'balance',
        'recorded_by',
    ];

    protected $casts = [
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /** The same term the entry clerk was working through. */
    public function scopeForTerm($query, ?string $schoolYear, ?string $semester)
    {
        return $query
            ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
            ->when($semester, fn ($q) => $q->where('semester', $semester));
    }

    public function scopeSearch($query, ?string $term)
    {
        $term = trim((string) $term);
        if ($term === '') {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('student_name', 'like', "%{$term}%")
              ->orWhere('course', 'like', "%{$term}%");
        });
    }
}
