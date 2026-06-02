<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lms_submissions')) {
            return;
        }

        Schema::create('lms_submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_id');
            $table->unsignedBigInteger('student_user_id');
            $table->string('original_name');
            $table->string('storage_path', 1024);
            $table->string('mime_type', 191);
            $table->unsignedBigInteger('size_bytes');
            $table->string('extension', 16);
            $table->dateTime('submitted_at')->nullable();
            $table->decimal('score', 6, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->unsignedBigInteger('graded_by')->nullable();
            $table->dateTime('graded_at')->nullable();
            $table->timestamps();

            $table->index(['assignment_id', 'student_user_id'], 'lms_subm_assign_student_idx');
            $table->foreign('assignment_id')->references('id')->on('lms_assignments')->cascadeOnDelete();
            $table->foreign('student_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('graded_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_submissions');
    }
};
