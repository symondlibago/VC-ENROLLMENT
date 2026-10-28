<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * When the student was told their clearance came through.
 *
 * The column is what holds the email to one per clearance. recompute() runs
 * on every signature, and a bulk approval and a cashier can land on the same
 * clearance at the same moment, so the decision to send cannot be made from
 * the status alone.
 *
 * It also separates three states the status cannot: not cleared, cleared and
 * told, and cleared but deliberately not told — the last being a finished
 * term signed off in bulk as a records exercise.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clearances', function (Blueprint $table) {
            $table->timestamp('cleared_notified_at')->nullable()->after('cleared_at');
        });

        // Everything already cleared happened before there was anything to
        // send, so it is stamped as handled. Without this the first signature
        // of the day could mail hundreds of students about a clearance that
        // was signed off weeks ago.
        DB::table('clearances')
            ->where('status', 'cleared')
            ->update(['cleared_notified_at' => DB::raw('COALESCE(cleared_at, updated_at)')]);
    }

    public function down(): void
    {
        Schema::table('clearances', function (Blueprint $table) {
            $table->dropColumn('cleared_notified_at');
        });
    }
};
