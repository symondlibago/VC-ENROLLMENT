<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\IncRecord;

/**
 * Keeps completion records in step with the grades they come from.
 *
 * Marking a grade INC, NFE or NFR opens a record on the INC page as "awaiting
 * payment"; taking that mark away again withdraws it, but only while nothing
 * has been paid or approved, so a form already in progress is never silently
 * removed. Which of the three it was is kept on the record, because the
 * cashier and the printed form both have to name it.
 */
class IncRecordService
{
    public static function syncForGrade(Grade $grade): ?IncRecord
    {
        $student = $grade->student;
        if (!$student) {
            return null;
        }

        // The term is resolved once and used for both the lookup and the
        // insert below. Looking up on $grade->school_year while inserting the
        // student's meant a grade with no term of its own — 3,727 of them —
        // created a record it could never find again: the next sync searched
        // for `school_year = NULL`, matched nothing, and tried to insert a
        // second row over the unique key on the term.
        $schoolYear = $grade->school_year ?? $student->school_year;
        $semester = $grade->semester ?? $student->semester;

        $existing = IncRecord::where('pre_enrolled_student_id', $grade->pre_enrolled_student_id)
            ->where('subject_id', $grade->subject_id)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->first();

        // A grade held back for clearance also reads INC, but it is not an
        // incomplete mark: the work was done and the result earned. There is
        // nothing to pay for and nothing for an instructor to complete — it
        // returns to its real result the moment the clearance is signed. So
        // it must never open a completion form, and any form already opened
        // for one is withdrawn here.
        if (!$grade->needsCompletionForm()) {
            if (!$existing) {
                return null;
            }

            // A clearance hold should leave no trace on this page at all. A
            // form opened for one and never acted on is removed outright
            // rather than withdrawn, because "Withdrawn" reads as a decision
            // somebody made about an incomplete mark — and nobody did.
            if ($grade->clearance_hold && self::isUntouched($existing)) {
                $existing->delete();

                return null;
            }

            // Otherwise it is an ordinary INC that no longer applies: keep
            // the record and withdraw it, so the history stays readable
            if ($existing->status === 'awaiting_payment') {
                $existing->update(['status' => 'cancelled']);
            }

            return $existing;
        }

        if ($existing) {
            // Re-opened after being withdrawn
            if ($existing->status === 'cancelled') {
                $existing->update(['status' => 'awaiting_payment']);
            }

            // Keep the source details current while the form has not been paid
            // yet — the remark among them, so an instructor changing NFE to
            // INC before anyone pays is reflected on the form rather than
            // leaving it describing the wrong thing.
            if ($existing->status === 'awaiting_payment') {
                $existing->update([
                    'grade_id' => $grade->id,
                    'instructor_id' => $grade->instructor_id,
                    'section_id' => $grade->section_id,
                    'year' => $grade->year ?? $student->year,
                    'grade_remark' => $grade->status,
                ]);
            }

            return $existing;
        }

        return IncRecord::create([
            'pre_enrolled_student_id' => $grade->pre_enrolled_student_id,
            'subject_id' => $grade->subject_id,
            'grade_id' => $grade->id,
            'instructor_id' => $grade->instructor_id,
            'section_id' => $grade->section_id,
            'school_year' => $schoolYear,
            'semester' => $semester,
            'year' => $grade->year ?? $student->year,
            'status' => 'awaiting_payment',
            // INC, NFE or NFR — whichever the instructor actually wrote
            'grade_remark' => $grade->status,
        ]);
    }

    /**
     * Whether nobody has acted on this form yet.
     *
     * Money and signatures are the test: once either exists the record is
     * part of someone's day and is never removed from under them, only
     * withdrawn. Public because undoing a clearance signature asks the same
     * question before putting a grade back on hold, and two answers to it
     * would be one too many.
     */
    public static function isUntouched(IncRecord $record): bool
    {
        return $record->status === 'awaiting_payment'
            && $record->amount === null
            && $record->or_number === null
            && $record->cashier_approved_at === null
            && $record->instructor_approved_at === null
            && $record->program_head_approved_at === null
            && $record->registrar_approved_at === null;
    }
}
