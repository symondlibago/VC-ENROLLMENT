<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Lets a grade be recorded as Dropped.
 *
 * Zero in every grading period is a student who stopped turning up rather than
 * one who sat the assessments and scored nothing, so the status derived from
 * the marks can now be `Dropped`. The column is an enum, so the value has to
 * exist here before anything can write it — otherwise saving the marks fails
 * outright with a truncation error.
 *
 * Written as raw SQL on purpose: Doctrine does not model MySQL enums, so the
 * schema builder cannot alter one without dropping the column and its data.
 */
return new class extends Migration
{
    private const WITH_DROPPED =
        "'Passed','Failed','INC','In Progress','NFE','NFR','DA','Credited','Dropped'";

    private const WITHOUT_DROPPED =
        "'Passed','Failed','INC','In Progress','NFE','NFR','DA','Credited'";

    public function up(): void
    {
        DB::statement(
            'ALTER TABLE grades MODIFY status ENUM(' . self::WITH_DROPPED . ") NOT NULL DEFAULT 'In Progress'"
        );
    }

    public function down(): void
    {
        // Anything already dropped would not fit the narrower column, so it
        // goes back to the result the same marks used to produce
        DB::table('grades')->where('status', 'Dropped')->update(['status' => 'Failed']);

        DB::statement(
            'ALTER TABLE grades MODIFY status ENUM(' . self::WITHOUT_DROPPED . ") NOT NULL DEFAULT 'In Progress'"
        );
    }
};
