<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Section extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'course_id', 'is_full'];

    protected $casts = [
        'is_full' => 'boolean',
    ];

    /**
     * Get the course that owns the section.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * The students that belong to the section.
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(PreEnrolledStudent::class, 'section_student');
    }
}