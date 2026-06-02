<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('lms_modules')) return;
        if (Schema::hasColumn('lms_modules', 'section_id')) return;

        Schema::table('lms_modules', function (Blueprint $table) {
            $table->unsignedBigInteger('section_id')->nullable()->after('subject_id');
            $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();
            $table->index(['subject_id', 'section_id']);
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('lms_modules')) return;
        if (!Schema::hasColumn('lms_modules', 'section_id')) return;

        Schema::table('lms_modules', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropIndex(['subject_id', 'section_id']);
            $table->dropColumn('section_id');
        });
    }
};
