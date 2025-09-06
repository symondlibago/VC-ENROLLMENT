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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('subject_code');
            $table->string('descriptive_title');
            $table->float('lec_hrs')->nullable();
            $table->float('lab_hrs')->nullable();
            $table->float('total_units')->nullable();
            $table->float('number_of_hours')->nullable();
            $table->string('pre_req')->nullable();
            $table->enum('year', ['Grade 11', 'Grade 12', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Summer']);
            $table->enum('semester', ['1st Semester', '2nd Semester']);
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};