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
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_enrolled_student_id')->constrained('pre_enrolled_students')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('instructor_id')->constrained('instructors')->onDelete('cascade');
            $table->decimal('prelim_grade', 5, 2)->nullable();
            $table->decimal('midterm_grade', 5, 2)->nullable();
            $table->decimal('semifinal_grade', 5, 2)->nullable();
            $table->decimal('final_grade', 5, 2)->nullable();
            $table->enum('status', ['Passed', 'Failed', 'Incomplete', 'In Progress'])->default('In Progress');
            $table->timestamps();

            // Ensure a student has only one grade entry per subject
            $table->unique(['pre_enrolled_student_id', 'subject_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};