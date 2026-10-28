<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\IncRecord;

/**
 * Keeps INC records in step with the grades they come from.
 *
 * Marking a grade INC opens a record on the INC page as "awaiting payment";
 * taking the INC mark away again withdraws it, but only while nothing has been
 * paid or approved, so a form already in progress is never silently removed.
 */
class IncRecordService
{
    public static function syncForGrade(Grade $grade): ?IncRecord
    {
        $student = $grade->student;
        if (!$student) {
            return null;
        }

        $existing = IncRecord::where('pre_enrolled_student_id', $grade->pre_enrolled_student_id)
            ->where('subject_id', $grade->subject_id)
            ->where('school_year', $grade->school_year)
            ->where('semester', $grade->semester)
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

            // Keep the source details current while the form has not been paid yet
            if ($existing->status === 'awaiting_payment') {
                $existing->update([
                    'grade_id' => $grade->id,
                    'instructor_id' => $grade->instructor_id,
                    'section_id' => $grade->section_id,
                    'year' => $grade->year ?? $student->year,
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
            'school_year' => $grade->school_year ?? $student->school_year,
            'semester' => $grade->semester ?? $student->semester,
            'year' => $grade->year ?? $student->year,
            'status' => 'awaiting_payment',
        ]);
    }

    /**
     * Whether nobody has acted on this form yet.
     *
     * Money and signatures are the test: once either exists the record is
     * part of someone's day and is never removed from under them, only
     * withdrawn.
     */
    private static function isUntouched(IncRecord $record): bool
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
