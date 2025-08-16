<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_number',
        'name',
        'image_url',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get all scores for this candidate
     */
    public function scores(): HasMany
    {
        return $this->hasMany(Score::class);
    }

    /**
     * Get average score for a specific category
     */
    public function getAverageScore(string $category): float
    {
        return $this->scores()
            ->where('category', $category)
            ->avg('score') ?? 0;
    }

    /**
     * Get total weighted score
     */
    public function getTotalScore(): float
    {
        $sportsAttire = $this->getAverageScore('sports_attire') * 0.20;
        $swimsuit = $this->getAverageScore('swimsuit') * 0.20;
        $talent = $this->getAverageScore('talent') * 0.10;
        $gown = $this->getAverageScore('gown') * 0.20;
        $qa = $this->getAverageScore('qa') * 0.30;

        return $sportsAttire + $swimsuit + $talent + $gown + $qa;
    }

    /**
     * Get scores breakdown
     */
    public function getScoresBreakdown(): array
    {
        return [
            'sports_attire' => $this->getAverageScore('sports_attire'),
            'swimsuit' => $this->getAverageScore('swimsuit'),
            'talent' => $this->getAverageScore('talent'),
            'gown' => $this->getAverageScore('gown'),
            'qa' => $this->getAverageScore('qa'),
            'total' => $this->getTotalScore()
        ];
    }
}

