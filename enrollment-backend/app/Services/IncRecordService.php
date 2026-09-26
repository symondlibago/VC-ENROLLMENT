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

        if ($grade->status !== 'INC') {
            // No longer INC: withdraw the record if it is still untouched
            if ($existing && $existing->status === 'awaiting_payment') {
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
}
