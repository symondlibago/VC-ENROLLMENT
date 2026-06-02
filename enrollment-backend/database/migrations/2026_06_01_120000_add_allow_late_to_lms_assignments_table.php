<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('lms_assignments')) {
            return;
        }
        if (Schema::hasColumn('lms_assignments', 'allow_late')) {
            return;
        }

        Schema::table('lms_assignments', function (Blueprint $table) {
            // false = strict deadline (default). When true, students may submit
            // after due_at and the submission is flagged late.
            $table->boolean('allow_late')->default(false)->after('due_at');
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('lms_assignments') && Schema::hasColumn('lms_assignments', 'allow_late')) {
            Schema::table('lms_assignments', function (Blueprint $table) {
                $table->dropColumn('allow_late');
            });
        }
    }
};
