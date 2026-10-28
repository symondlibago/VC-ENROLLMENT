<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the held-for-clearance list.
 *
 * The list is filtered by the hold flag, then by one instructor or one term.
 * On the single `clearance_hold` index the database could only seek as far as
 * "every held grade in the school" and scan the rest away — which at the end
 * of a term, with signing still outstanding, is a few thousand rows read to
 * return the dozen an instructor actually teaches.
 *
 * These two cover the whole predicate, so each view seeks straight to its own
 * rows however many are held overall.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            // An instructor's view: the holds on their own classes
            $table->index(
                ['clearance_hold', 'instructor_id', 'school_year', 'semester'],
                'grades_held_instructor_index'
            );

            // The registrar's, cashier's and admin's view: a whole term
            $table->index(
                ['clearance_hold', 'school_year', 'semester'],
                'grades_held_term_index'
            );

            // Strictly a leftmost prefix of both of the above, so it can never
            // be chosen over them — it earns nothing and costs a write on
            // every grade saved. Anything that filtered on the flag alone is
            // served by the prefix of the new indexes instead.
            $table->dropIndex('grades_clearance_hold_index');
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->index('clearance_hold', 'grades_clearance_hold_index');
            $table->dropIndex('grades_held_instructor_index');
            $table->dropIndex('grades_held_term_index');
        });
    }
};
