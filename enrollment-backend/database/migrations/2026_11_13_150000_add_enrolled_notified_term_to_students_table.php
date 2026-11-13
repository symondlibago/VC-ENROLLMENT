<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Turns the "you're officially enrolled" notice from once-per-student into
 * once-per-term.
 *
 * `enrolled_notified_at` alone could only answer "has this student ever been
 * told?", so a continuing student who re-enrolled for a new semester was
 * skipped in silence — they had been told once, in a term that had since
 * ended. Recording *which* term the notice covered lets the same student be
 * told again next semester without ever being told twice about the same one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->string('enrolled_notified_term', 80)->nullable()->after('enrolled_notified_at');
        });

        // Anyone already notified was notified about the term they are sitting
        // in now, so that term is stamped as covered. Without this the next
        // cashier approval would re-send a notice they already have.
        DB::table('pre_enrolled_students')
            ->whereNotNull('enrolled_notified_at')
            ->update([
                'enrolled_notified_term' => DB::raw(
                    "CONCAT(LOWER(TRIM(COALESCE(school_year, ''))), '|', LOWER(TRIM(COALESCE(semester, ''))))"
                ),
            ]);
    }

    public function down(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->dropColumn('enrolled_notified_term');
        });
    }
};
