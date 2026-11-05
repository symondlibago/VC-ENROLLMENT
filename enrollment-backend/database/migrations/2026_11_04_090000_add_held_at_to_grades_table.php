<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When a grade was first held back for an unsigned clearance.
 *
 * Two jobs. It is the evidence behind a fee — a student disputing an INC can
 * be shown the moment it was incurred, against the `cleared_at` on their
 * clearance. And it is the cutoff for the rule itself: a hold placed before
 * this column existed carries no date, and those still release straight back
 * to the result they earned, because they were recorded when clearing a
 * student simply let their grades through. Nobody is billed under a rule that
 * was decided after their grade was already sitting on hold.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->timestamp('held_at')->nullable()->after('held_status');
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropColumn('held_at');
        });
    }
};
