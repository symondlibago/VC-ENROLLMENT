<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            // Add the section_id column after subject_id (optional placement)
            $table->foreignId('section_id')
                  ->nullable()
                  ->after('subject_id') // Places it after subject_id column
                  ->constrained('sections')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            // Drop the foreign key first, then the column
            $table->dropForeign(['section_id']);
            $table->dropColumn('section_id');
        });
    }
};