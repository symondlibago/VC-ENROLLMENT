<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('grading_periods', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., prelim, midterm, semifinal, final, enrollment
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });

        // Seed the table with the four essential grading periods
        DB::table('grading_periods')->insert([
            ['name' => 'prelim', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'midterm', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'semifinal', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'final', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'enrollment', 'created_at' => now(), 'updated_at' => now()], // ✅ ADDED
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('grading_periods');
    }
};