<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marks a grade held at INC because the student is not yet cleared.
 *
 * The hold is kept apart from an ordinary INC so it can be lifted
 * automatically the moment the clearance is signed off, and so the INC
 * records page can list the two kinds separately. `held_status` remembers
 * what the grade had actually earned, so releasing it restores the real
 * result rather than guessing at one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->boolean('clearance_hold')->default(false)->after('status');
            $table->string('held_status', 20)->nullable()->after('clearance_hold');

            $table->index('clearance_hold');
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropIndex(['clearance_hold']);
            $table->dropColumn(['clearance_hold', 'held_status']);
        });
    }
};
