<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Score extends Model
{
    use HasFactory;

    protected $fillable = [
        'judge_id',
        'candidate_id',
        'category',
        'score'
    ];

    protected $casts = [
        'score' => 'decimal:2',
    ];

    /**
     * Get the judge that owns the score
     */
    public function judge(): BelongsTo
    {
        return $this->belongsTo(User::class, 'judge_id');
    }

    /**
     * Get the candidate that owns the score
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    /**
     * Scope to filter by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to filter by judge
     */
    public function scopeByJudge($query, int $judgeId)
    {
        return $query->where('judge_id', $judgeId);
    }

    /**
     * Scope to filter by candidate
     */
    public function scopeByCandidate($query, int $candidateId)
    {
        return $query->where('candidate_id', $candidateId);
    }
}

