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
        // Drop the old text column if it exists
        if (Schema::hasColumn('schedules', 'instructor')) {
            $table->dropColumn('instructor');
        }
        
        // Add the new foreign key column
        $table->foreignId('instructor_id')
              ->nullable() // Make it nullable in case a schedule is created without an instructor
              ->after('room_no')
              ->constrained('instructors')
              ->onDelete('set null'); // If an instructor is deleted, set this to null
    });
}

public function down(): void
{
    Schema::table('schedules', function (Blueprint $table) {
        $table->dropForeign(['instructor_id']);
        $table->dropColumn('instructor_id');
        $table->string('instructor')->nullable(); // Re-add the old column on rollback
    });
}
};
