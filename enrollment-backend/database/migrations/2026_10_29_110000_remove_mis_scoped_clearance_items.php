<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Removes signature lines filed against the wrong kind of clearance.
 *
 * Generating a term picked every active line rather than only the student
 * ones, so once the faculty lines existed, every student clearance collected
 * those eight as well — a student being asked to wait on the TESDA In-Charge.
 * The selection is fixed in ClearanceService; this clears up what it wrote.
 *
 * Only unsigned lines are removed. A signature is a record of something a
 * person did, and is never deleted by a repair — any that were signed are
 * left in place and reported, to be looked at rather than silently dropped.
 *
 * Statuses are then settled, because adding those lines left clearances
 * reading cleared while rows under them sat pending.
 */
return new class extends Migration
{
    public function up(): void
    {
        $signed = DB::selectOne(
            "SELECT COUNT(*) AS total
               FROM clearance_items i
               JOIN clearances c ON c.id = i.clearance_id
               JOIN clearance_roles r ON r.id = i.clearance_role_id
              WHERE i.status = 'approved'
                AND ((c.pre_enrolled_student_id IS NOT NULL AND r.scope = 'faculty')
                  OR (c.instructor_id IS NOT NULL AND r.scope = 'student'))"
        );

        if ((int) ($signed->total ?? 0) > 0) {
            // Left alone on purpose — see the note above
            logger()->warning('Mis-scoped clearance lines were already signed and have been kept.', [
                'count' => (int) $signed->total,
            ]);
        }

        DB::statement(
            "DELETE i
               FROM clearance_items i
               JOIN clearances c ON c.id = i.clearance_id
               JOIN clearance_roles r ON r.id = i.clearance_role_id
              WHERE i.status = 'pending'
                AND ((c.pre_enrolled_student_id IS NOT NULL AND r.scope = 'faculty')
                  OR (c.instructor_id IS NOT NULL AND r.scope = 'student'))"
        );

        // Settle every clearance that still has lines. Raw rather than through
        // the service on purpose: this is a repair, and nobody should be
        // emailed that they have "just been cleared" by a migration.
        DB::statement(
            "UPDATE clearances c
               JOIN (
                   SELECT i.clearance_id,
                          SUM(i.status = 'pending') AS still_open
                     FROM clearance_items i
                     JOIN clearance_roles r ON r.id = i.clearance_role_id
                    WHERE r.is_active = 1
                 GROUP BY i.clearance_id
               ) t ON t.clearance_id = c.id
                SET c.status = IF(t.still_open = 0, 'cleared', 'pending'),
                    c.cleared_at = IF(t.still_open = 0, COALESCE(c.cleared_at, NOW()), NULL)"
        );
    }

    public function down(): void
    {
        // Nothing to restore: the rows removed were created in error and
        // carried no signature.
    }
};
