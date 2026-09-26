<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per INC mark a student has to complete.
 *
 * Created automatically when a grade's status is set to INC, then carried
 * through payment (cashier) and the instructor, program head and registrar
 * approvals before the completion form can be exported.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inc_records', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('pre_enrolled_student_id');
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->unsignedBigInteger('instructor_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable();

            // Term the INC was incurred in, copied from the grade
            $table->string('school_year')->nullable();
            $table->string('semester')->nullable();
            $table->string('year')->nullable();

            // awaiting_payment → processing → completed (or cancelled)
            $table->string('status')->default('awaiting_payment');

            // Cashier step
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('or_number')->nullable();
            $table->date('payment_date')->nullable();

            // Approvals — cashier's is stamped automatically when payment is processed
            $table->timestamp('cashier_approved_at')->nullable();
            $table->unsignedBigInteger('cashier_approved_by')->nullable();
            $table->timestamp('instructor_approved_at')->nullable();
            $table->unsignedBigInteger('instructor_approved_by')->nullable();
            $table->timestamp('program_head_approved_at')->nullable();
            $table->unsignedBigInteger('program_head_approved_by')->nullable();
            $table->timestamp('registrar_approved_at')->nullable();
            $table->unsignedBigInteger('registrar_approved_by')->nullable();

            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('pre_enrolled_student_id')->references('id')->on('pre_enrolled_students')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('grade_id')->references('id')->on('grades')->nullOnDelete();
            $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();

            // One open INC per student per subject per term
            $table->unique(['pre_enrolled_student_id', 'subject_id', 'school_year', 'semester'], 'inc_unique_per_term');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inc_records');
    }
};
