<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * When the student last enrolled, as against when their record was first made.
 *
 * The Enrollment page has always shown `created_at` under "Enrollment Date",
 * which is the day a student first applied and never moves again. For anybody
 * continuing, that is a date from years back — it says nothing about the term
 * they are actually enrolling into now.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->timestamp('enrolled_at')->nullable()->after('enrollment_status');
            // The enrollment list sorts on it
            $table->index('enrolled_at');
        });

        // The day they first applied, which is right for everyone who has
        // never re-enrolled.
        DB::table('pre_enrolled_students')->update(['enrolled_at' => DB::raw('created_at')]);

        // A continuing student's previous term is archived at the moment they
        // re-enrol, so the newest archived row is the date of their latest
        // enrollment. Without this, every one of them would read as the day
        // they first applied until the next time they enrol.
        DB::statement("
            UPDATE pre_enrolled_students AS s
            JOIN (
                SELECT pre_enrolled_student_id, MAX(created_at) AS latest
                FROM enrollment_histories
                GROUP BY pre_enrolled_student_id
            ) AS h ON h.pre_enrolled_student_id = s.id
            SET s.enrolled_at = h.latest
            WHERE h.latest > s.enrolled_at
        ");
    }

    public function down(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->dropIndex(['enrolled_at']);
            $table->dropColumn('enrolled_at');
        });
    }
};
