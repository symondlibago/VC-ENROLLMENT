<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_enrolled_student_id')->constrained('pre_enrolled_students');
            $table->foreignId('enrollment_code_id')->constrained('enrollment_codes');
            
            // Payment details
            $table->decimal('previous_account', 10, 2)->nullable()->default(0);
            $table->decimal('registration_fee', 10, 2)->nullable()->default(0);
            $table->decimal('tuition_fee', 10, 2)->nullable()->default(0);
            $table->decimal('laboratory_fee', 10, 2)->nullable()->default(0);
            $table->decimal('miscellaneous_fee', 10, 2)->nullable()->default(0);
            $table->decimal('other_fees', 10, 2)->nullable()->default(0);
            $table->decimal('bundled_program_fee', 10, 2)->nullable()->default(0);
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->decimal('payment_amount', 10, 2)->nullable();
            $table->decimal('discount', 10, 2)->nullable()->default(0);
            $table->decimal('discount_deduction', 10, 2)->nullable()->default(0);
            $table->decimal('remaining_amount', 10, 2)->nullable();
            $table->decimal('term_payment')->nullable();
            $table->date('payment_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
