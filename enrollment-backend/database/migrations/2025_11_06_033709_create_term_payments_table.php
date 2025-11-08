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
        Schema::create('term_payments', function (Blueprint $table) {
            $table->id();
            // This links the installment to the main payment record
            $table->foreignId('payment_id')->constrained('payments')->onDelete('cascade');
            
            // This is for easy lookup
            $table->foreignId('pre_enrolled_student_id')->constrained('pre_enrolled_students')->onDelete('cascade');
            $table->string('or_number')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->date('payment_date');
            $table->string('year')->nullable();
            $table->string('semester')->nullable();
            $table->string('school_year')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('term_payments');
    }
};