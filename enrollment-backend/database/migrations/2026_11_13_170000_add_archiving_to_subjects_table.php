<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets a subject be retired from the curriculum without being destroyed.
 *
 * Deleting one cascades through grades, enrolments, INC records, schedules
 * and add/drop history, permanently — which is the wrong tool for a
 * curriculum change, where the subject must stop being offered but every
 * record of who took it has to stand. Archiving sets a date instead: the
 * subject stops appearing anywhere a subject can be chosen, and everything
 * already attached to it carries on untouched.
 *
 * A nullable timestamp rather than a boolean, because "when" costs the same
 * to store as "whether" and answers the question the registrar will ask.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('prerequisite_id');

            // Who retired it. Keeps the subject if that account is ever
            // removed — the curriculum outlives the staff list.
            $table->foreignId('archived_by')->nullable()->after('archived_at')
                ->constrained('users')->nullOnDelete();

            // Every list of selectable subjects filters on this, so it is
            // worth an index even at today's row count.
            $table->index('archived_at');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropIndex(['archived_at']);
            $table->dropConstrainedForeignId('archived_by');
            $table->dropColumn('archived_at');
        });
    }
};
