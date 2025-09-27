<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shiftee_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_enrolled_student_id')->constrained('pre_enrolled_students')->onDelete('cascade');
            $table->foreignId('previous_course_id')->constrained('courses');
            $table->foreignId('new_course_id')->constrained('courses');
            $table->enum('status', ['pending_program_head', 'approved', 'rejected'])->default('pending_program_head');
            $table->text('rejection_remarks')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shiftee_requests');
    }
};