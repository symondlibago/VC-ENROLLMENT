<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Records which remark opened a completion form.
 *
 * NFE and NFR are now settled the same way an INC is — pay, collect the four
 * signatures, and the mark resolves to what was earned — so the INC page
 * holds all three. Without this column every one of them would read "INC" to
 * the cashier and print "INC mark" on the form, which is not what the
 * instructor wrote on the grade.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inc_records', function (Blueprint $table) {
            $table->string('grade_remark', 10)->default('INC')->after('status');
        });

        // Every record that exists today was opened by an INC, which is the
        // default — but say so explicitly rather than leaning on it, so the
        // backfill is visible to anyone reading this later.
        DB::table('inc_records')->update(['grade_remark' => 'INC']);
    }

    public function down(): void
    {
        Schema::table('inc_records', function (Blueprint $table) {
            $table->dropColumn('grade_remark');
        });
    }
};
