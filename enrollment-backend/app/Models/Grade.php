<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'pre_enrolled_student_id',
        'subject_id',
        'instructor_id',
        // The term and section this grade was earned in. Kept on the grade row
        // itself so re-enrollment (which re-syncs the student's subjects and
        // sections) can never orphan it.
        'section_id',
        'school_year',
        'semester',
        'year',
        'prelim_grade',
        'midterm_grade',
        'semifinal_grade',
        'final_grade',
        'status',
        // Held at INC because the student has not been cleared. `held_status`
        // is the result the grade actually earned, kept so lifting the hold
        // restores it rather than recomputing from marks that may have moved.
        'clearance_hold',
        'held_status',
    ];

    protected $casts = [
        'prelim_grade' => 'float',
        'midterm_grade' => 'float',
        'semifinal_grade' => 'float',
        'final_grade' => 'float',
        'clearance_hold' => 'boolean',
    ];

    /**
     * Statuses a person sets deliberately, which are kept rather than
     * recomputed from the marks.
     *
     * One list, because four copies of it drifted apart the moment a fifth
     * meaning was added.
     */
    public const MANUAL_REMARKS = ['INC', 'NFE', 'NFR', 'DA', 'Credited'];

    /**
     * Whether the status was chosen by a person rather than derived.
     *
     * A grade held for clearance also reads INC, but nobody chose it, so it
     * must keep following the marks — otherwise editing it later would leave
     * `held_status` describing a result the grade no longer has.
     */
    public function hasManualRemark(): bool
    {
        return in_array($this->status, self::MANUAL_REMARKS, true) && !$this->clearance_hold;
    }

    /**
     * Whether this INC is the kind that needs a completion form — paid for,
     * approved, issued. A clearance hold is not: it resolves itself.
     */
    public function needsCompletionForm(): bool
    {
        return $this->status === 'INC' && !$this->clearance_hold;
    }

    /** The same question as a query, so a filter cannot forget the difference. */
    public function scopeNeedingCompletion($query)
    {
        return $query->where('status', 'INC')->where('clearance_hold', false);
    }

    /** Grades reading INC only because the student is not yet cleared. */
    public function scopeHeldForClearance($query)
    {
        return $query->where('clearance_hold', true);
    }

    /**
     * The grade as the grading screens and the sheet exports read it.
     *
     * One shape in one place. Three controllers were each building this array
     * by hand, which is how `clearance_hold` came to be missing from all of
     * them — and why an exported grading sheet printed PASSED over a result
     * the record was holding at INC.
     *
     * Takes a null grade so a student with no record yet still answers with
     * the full shape rather than a missing key.
     */
    public static function payloadFor(?self $grade): array
    {
        return [
            'prelim_grade' => $grade->prelim_grade ?? null,
            'midterm_grade' => $grade->midterm_grade ?? null,
            'semifinal_grade' => $grade->semifinal_grade ?? null,
            'final_grade' => $grade->final_grade ?? null,
            'status' => $grade->status ?? 'In Progress',
            // Reading INC only because the clearance is unsigned, and the
            // result it actually earned. Together these tell a held INC apart
            // from one an instructor chose, which look identical otherwise.
            'clearance_hold' => (bool) ($grade->clearance_hold ?? false),
            'held_status' => $grade->held_status ?? null,
        ];
    }

    public function student()
    {
        return $this->belongsTo(PreEnrolledStudent::class, 'pre_enrolled_student_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function instructor()
    {
        return $this->belongsTo(Instructor::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    /**
     * Senior High (Grade 11 and Grade 12) is marked on three terms rather than
     * the four college periods. The three sit on the first three grade columns
     * — Term 1 is prelim, Term 2 midterm, Term 3 semi-final — so a mark keeps
     * its position and the fourth column simply goes unused.
     */
    public function isShs(): bool
    {
        $year = (string) ($this->year ?? $this->student->year ?? '');

        return str_contains($year, 'Grade 11') || str_contains($year, 'Grade 12');
    }

    /** The periods this grade is actually marked on. */
    public function periodGrades(): array
    {
        $periods = [$this->prelim_grade, $this->midterm_grade, $this->semifinal_grade];

        if (!$this->isShs()) {
            $periods[] = $this->final_grade;
        }

        return $periods;
    }

    /**
     * The overall final grade: the mean of the periods that class uses, to the
     * nearest whole number. Null until every one of them has been marked.
     */
    public function computedFinalGrade(): ?float
    {
        $periods = $this->periodGrades();

        foreach ($periods as $grade) {
            if ($grade === null) {
                return null;
            }
        }

        return round(array_sum($periods) / count($periods));
    }

    /**
     * The mark a pass or fail is judged on. College has always used the final
     * period; Senior High has no fourth period, so it uses the three-term
     * average instead.
     */
    public function passingMark(): ?float
    {
        return $this->isShs() ? $this->computedFinalGrade() : $this->final_grade;
    }
}