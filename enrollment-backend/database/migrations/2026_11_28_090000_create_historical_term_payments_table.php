<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Term payments from before the system existed, typed up from the cashier's
 * paper records.
 *
 * Deliberately NOT rows in `payments`. That table hangs off
 * `pre_enrolled_student_id` and `enrollment_code_id`, so every row in it
 * belongs to a live enrolment and feeds the balance the cashier works from.
 * These are a name on an old ledger page, often for a course the school no
 * longer offers and a student who was never in this system. Putting them in
 * `payments` would mean inventing an enrolment for each one and would let a
 * typo from 2015 move a balance someone is being charged today.
 *
 * Kept apart, they are a searchable archive that can never disturb a live
 * account, and the table can be reported on or exported on its own.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historical_term_payments', function (Blueprint $table) {
            $table->id();

            $table->string('student_name');
            // Free text on purpose: "BSBA-MM", courses long since retired, and
            // whatever the old ledger actually said. The string is the record.
            $table->string('course');
            $table->string('school_year', 20);
            $table->string('semester', 40);

            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);

            // Who typed it in, so a bad batch can be traced back to its sitting.
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // The two ways this is ever read: a term at a time, or by name.
            $table->index(['school_year', 'semester'], 'htp_term_index');
            $table->index('student_name', 'htp_name_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historical_term_payments');
    }
};
