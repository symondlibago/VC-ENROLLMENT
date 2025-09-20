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
        Schema::create('enrollment_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_enrolled_student_id')->constrained('pre_enrolled_students')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role'); // e.g., 'Program Head', 'Registrar', 'Cashier'
            $table->enum('status', ['approved', 'rejected', 'pending'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps(); // The 'created_at' will serve as the approval/rejection date

            $table->unique(['pre_enrolled_student_id', 'role']); // Ensures one approval entry per role for each student
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_approvals');
    }
};
