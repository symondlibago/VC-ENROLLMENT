<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'subject_code',
        'descriptive_title',
        'lec_hrs',
        'lab_hrs',
        'total_units',
        'year',
        'semester',
        'course_id',
        'number_of_hours',
        'prerequisite_id',
        'archived_at',
        'archived_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'lec_hrs' => 'float',
        'lab_hrs' => 'float',
        'total_units' => 'float',
        'number_of_hours' => 'float',
        'course_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /**
     * Sent with every subject so no screen has to work it out from a date.
     *
     * @var array<int, string>
     */
    protected $appends = ['is_archived'];

    public function getIsArchivedAttribute(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * Still part of the curriculum, so still offerable.
     *
     * Every list a subject can be *chosen* from goes through this. Lists of
     * what a student already has must not — detaching history from a record
     * because the curriculum moved on is exactly what archiving exists to
     * prevent.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Retires the subject, or brings it back. Archiving twice does not move
     * the date, so the original retirement is never overwritten by a stray
     * second click.
     */
    public function archive(?int $userId = null): bool
    {
        if ($this->archived_at !== null) {
            return false;
        }

        return $this->forceFill([
            'archived_at' => now(),
            'archived_by' => $userId,
        ])->save();
    }

    public function restore(): bool
    {
        if ($this->archived_at === null) {
            return false;
        }

        return $this->forceFill([
            'archived_at' => null,
            'archived_by' => null,
        ])->save();
    }

    /**
     * Get the course that owns the subject.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function prerequisite()
    {
        // A subject belongs to another subject, which is its prerequisite.
        return $this->belongsTo(Subject::class, 'prerequisite_id');
    }

    public function archivedBy()
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    /**
     * Get the schedules for the subject.
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function students()
    {
        return $this->belongsToMany(\App\Models\PreEnrolledStudent::class, 'student_subject', 'subject_id', 'pre_enrolled_student_id')
                    ->withPivot('status') 
                    ->withTimestamps();
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}