<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A student's clearance for one term.
 *
 * College takes one per semester; Senior High one per school year, which is
 * why the term is stored as a string that may read 'Whole Year'.
 */
class Clearance extends Model
{
    protected $fillable = [
        'pre_enrolled_student_id',
        'school_year',
        'semester',
        'year_level',
        'status',
        'cleared_at',
        // When the student was emailed about it. The guard that keeps the
        // notice to one per clearance however often the status is recomputed.
        'cleared_notified_at',
    ];

    protected $casts = [
        'cleared_at' => 'datetime',
        'cleared_notified_at' => 'datetime',
    ];

    /** The term a Senior High clearance covers, in place of a semester. */
    public const WHOLE_YEAR = 'Whole Year';

    public function student(): BelongsTo
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ClearanceItem::class);
    }

    public function scopeForTerm($query, string $schoolYear, ?string $semester = null)
    {
        return $query->where('school_year', $schoolYear)
            ->when($semester, fn ($q) => $q->where('semester', $semester));
    }

    public function isCleared(): bool
    {
        return $this->status === 'cleared';
    }

    /** How the term reads to a person: "1st Semester" or just the year. */
    public function getTermLabelAttribute(): string
    {
        return $this->semester === self::WHOLE_YEAR
            ? $this->school_year
            : "{$this->semester}, {$this->school_year}";
    }
}
