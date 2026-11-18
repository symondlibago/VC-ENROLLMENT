<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One unfinished Official Transcript of Records, saved to be finished later. */
class TranscriptDraft extends Model
{
    protected $fillable = [
        'user_id',
        'pre_enrolled_student_id',
        'title',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    /**
     * A name for the list, taken from whatever the registrar has typed so far.
     *
     * Falls back rather than refusing: a draft saved two fields in still has
     * to be findable tomorrow, and "Untitled" at least says it exists.
     */
    public static function titleFrom(array $payload): string
    {
        $name = trim((string) data_get($payload, 'student.name'));

        if ($name !== '') {
            return mb_substr($name, 0, 255);
        }

        $number = trim((string) data_get($payload, 'student.student_id_number'));

        return $number !== '' ? mb_substr($number, 0, 255) : 'Untitled transcript';
    }

    /** The row as the drafts list shows it — never the whole payload. */
    public function summary(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'student_id_number' => data_get($this->payload, 'student.student_id_number') ?: null,
            'pre_enrolled_student_id' => $this->pre_enrolled_student_id,
            'subject_count' => $this->subjectCount(),
            'owner' => $this->user->name ?? null,
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }

    /**
     * How much is in it, so the list can say "3 subjects" rather than leaving
     * the registrar to open each one to find out which is which.
     */
    public function subjectCount(): int
    {
        $count = 0;

        foreach ((array) data_get($this->payload, 'sections', []) as $section) {
            foreach ((array) data_get($section, 'terms', []) as $term) {
                foreach ((array) data_get($term, 'rows', []) as $row) {
                    if (trim((string) ($row['code'] ?? '')) !== ''
                        || trim((string) ($row['title'] ?? '')) !== '') {
                        $count++;
                    }
                }
            }
        }

        return $count;
    }
}
