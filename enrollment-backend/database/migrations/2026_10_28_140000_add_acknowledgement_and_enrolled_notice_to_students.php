<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The acknowledgement a student accepted, and whether they have been told
 * their enrollment went through.
 *
 * The version is stored beside the timestamp so the record says which wording
 * they agreed to. Quoting today's text against a signature from two years ago
 * would be a different document.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->timestamp('acknowledgement_accepted_at')->nullable()->after('signature');
            $table->string('acknowledgement_version', 20)->nullable()->after('acknowledgement_accepted_at');
            // Holds the "you are officially enrolled" email to one per student,
            // the same way cleared_notified_at does for clearance
            $table->timestamp('enrolled_notified_at')->nullable()->after('acknowledgement_version');
        });

        // Everyone already enrolled got there before there was anything to
        // send, so they are stamped as handled. Without this the next cashier
        // approval of the day could mail hundreds of students about an
        // enrollment they completed months ago.
        DB::table('pre_enrolled_students')
            ->where('enrollment_status', 'enrolled')
            ->update(['enrolled_notified_at' => DB::raw('COALESCE(updated_at, created_at)')]);
    }

    public function down(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->dropColumn([
                'acknowledgement_accepted_at',
                'acknowledgement_version',
                'enrolled_notified_at',
            ]);
        });
    }
};
