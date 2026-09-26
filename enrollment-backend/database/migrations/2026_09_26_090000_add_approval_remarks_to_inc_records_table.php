<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Each desk records its own remark when signing off an INC completion, so the
 * form carries the reason behind every approval.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inc_records', function (Blueprint $table) {
            $table->text('cashier_remarks')->nullable()->after('cashier_approved_by');
            $table->text('instructor_remarks')->nullable()->after('instructor_approved_by');
            $table->text('program_head_remarks')->nullable()->after('program_head_approved_by');
            $table->text('registrar_remarks')->nullable()->after('registrar_approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('inc_records', function (Blueprint $table) {
            $table->dropColumn(['cashier_remarks', 'instructor_remarks', 'program_head_remarks', 'registrar_remarks']);
        });
    }
};
