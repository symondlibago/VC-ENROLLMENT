<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Removes clearances left behind by a corrected school year.
 *
 * Editing a mistyped term on a student leaves the clearance the typo created
 * standing, and the registrar finds the student on a board for a semester
 * they never enrolled in. The observer now clears these up as they happen;
 * this is the ones already on record.
 *
 * Three conditions, all of which must hold:
 *
 *  - it is not the student's current term,
 *  - nothing on it has been signed, and
 *  - the student has no enrolment history for it.
 *
 * A term actually sat leaves a history row when the student moves on from
 * it, so a real semester that merely went unsigned is never swept up. Senior
 * High clears once for the year, so a 'Whole Year' row is matched on the
 * school year alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "DELETE c
               FROM clearances c
               JOIN pre_enrolled_students s ON s.id = c.pre_enrolled_student_id
              WHERE c.pre_enrolled_student_id IS NOT NULL
                AND NOT (s.school_year = c.school_year
                         AND (s.semester = c.semester OR c.semester = 'Whole Year'))
                AND NOT EXISTS (
                    SELECT 1 FROM clearance_items i
                     WHERE i.clearance_id = c.id AND i.status = 'approved'
                )
                AND NOT EXISTS (
                    SELECT 1 FROM enrollment_histories h
                     WHERE h.pre_enrolled_student_id = c.pre_enrolled_student_id
                       AND h.school_year = c.school_year
                       AND (h.semester = c.semester OR c.semester = 'Whole Year')
                )"
        );
    }

    public function down(): void
    {
        // Nothing to restore: the rows removed were for terms the students
        // were never enrolled in, and carried no signature.
    }
};
