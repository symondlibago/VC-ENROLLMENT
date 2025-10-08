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
        Schema::create('enrollment_histories', function (Blueprint $table) {
            $table->id();
            // Link to the main student record
            $table->foreignId('pre_enrolled_student_id')->constrained('pre_enrolled_students')->onDelete('cascade');
            $table->foreignId('course_id')->constrained('courses');
            $table->string('semester');
            $table->string('school_year');
            $table->string('year');
            $table->string('enrollment_type');
            $table->string('academic_status');
            $table->json('subjects_taken'); 
            $table->timestamps(); // Records when this history entry was created
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_histories');
    }
};
