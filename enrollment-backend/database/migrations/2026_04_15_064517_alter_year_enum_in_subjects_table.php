<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the ENUM to include your new values. 
        // This keeps existing data intact and just expands the allowed list.
        DB::statement("ALTER TABLE subjects MODIFY COLUMN year ENUM('Grade 11', 'Grade 12', '1st Year', '2nd Year', '3rd Year', '4th Year', '1st Year Summer', '2nd Year Summer', '3rd Year Summer', '4th Year Summer') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to the old ENUM state if you ever need to rollback
        DB::statement("ALTER TABLE subjects MODIFY COLUMN year ENUM('Grade 11', 'Grade 12', '1st Year', '2nd Year', '3rd Year', '4th Year', '1st Year Summer', '2nd Year Summer') NOT NULL");
    }
};