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
    Schema::create('subject_change_requests', function (Blueprint $table) {
        $table->id();
        $table->foreignId('pre_enrolled_student_id')->constrained('pre_enrolled_students')->onDelete('cascade');
        $table->enum('status', ['pending_program_head', 'pending_cashier', 'approved', 'rejected'])->default('pending_program_head');
        $table->text('rejection_remarks')->nullable();
        $table->foreignId('processed_by_program_head')->nullable()->constrained('users');
        $table->foreignId('processed_by_cashier')->nullable()->constrained('users');
        $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_change_requests');
    }
};
