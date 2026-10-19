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
    ];

    protected $casts = [
        'prelim_grade' => 'float',
        'midterm_grade' => 'float',
        'semifinal_grade' => 'float',
        'final_grade' => 'float',
    ];

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