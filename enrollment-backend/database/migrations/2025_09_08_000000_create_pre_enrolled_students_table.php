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
        Schema::create('pre_enrolled_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses');
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('gender');
            $table->date('birth_date');
            $table->string('birth_place');
            $table->string('nationality');
            $table->string('civil_status');
            $table->string('religion')->nullable();
            $table->string('address');
            $table->string('contact_number');
            $table->string('email_address');
            
            // Parent Information
            $table->string('father_name')->nullable();
            $table->string('father_occupation')->nullable();
            $table->string('father_contact_number')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('mother_occupation')->nullable();
            $table->string('mother_contact_number')->nullable();
            $table->string('parents_address')->nullable();
            
            // Emergency Contact
            $table->string('emergency_contact_name');
            $table->string('emergency_contact_number');
            $table->string('emergency_contact_address');
            
            // Educational Background
            $table->string('elementary')->nullable();
            $table->string('elementary_date_completed')->nullable();
            $table->string('junior_high_school')->nullable();
            $table->string('junior_high_date_completed')->nullable();
            $table->string('senior_high_school')->nullable();
            $table->string('senior_high_date_completed')->nullable();
            $table->string('high_school_non_k12')->nullable();
            $table->string('high_school_non_k12_date_completed')->nullable();
            $table->string('college')->nullable();
            $table->string('college_date_completed')->nullable();
            
            // Enrollment Information
            $table->string('semester');
            $table->string('school_year');
            $table->string('enrollment_type');
            $table->json('selected_subjects'); // Store subject IDs as JSON array
            
            // Approval Status
            $table->boolean('program_head_approved')->default(false);
            $table->boolean('registrar_approved')->default(false);
            $table->boolean('cashier_approved')->default(false);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pre_enrolled_students');
    }
};