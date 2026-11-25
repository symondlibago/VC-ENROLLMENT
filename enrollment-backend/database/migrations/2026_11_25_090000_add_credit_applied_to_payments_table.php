<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The credit a student was given this term out of last term's overpayment.
 *
 * `advance_payment` records a credit *before* it is spent and is cleared the
 * moment it is. Nothing recorded one afterwards, so the only trace of an
 * applied credit was the gap between the fee columns and `total_amount` — and
 * a gap cannot be told apart from somebody simply editing a fee, which made
 * every screen that recomputes the total either drop the credit or swallow
 * the edit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('credit_applied', 10, 2)->default(0)->after('advance_payment');
        });

        // Recover what was already applied, from the only place it survives.
        // Only where the stored total is lower than the fees: a total of zero
        // is a row nobody has assessed, not a free term.
        //
        // Every column is wrapped, not just the nullable-looking one: a blank
        // fee is stored as NULL on hundreds of these rows — 635 have no
        // miscellaneous_fee — and in SQL one NULL makes the whole sum NULL,
        // so the comparison silently matched nothing.
        $fees = 'COALESCE(previous_account, 0) + COALESCE(registration_fee, 0)'
            . ' + COALESCE(tuition_fee, 0) + COALESCE(laboratory_fee, 0)'
            . ' + COALESCE(miscellaneous_fee, 0) + COALESCE(other_fees, 0)'
            . ' + COALESCE(bundled_program_fee, 0)';

        DB::statement("
            UPDATE payments
            SET credit_applied = ROUND(({$fees}) - total_amount, 2)
            WHERE total_amount > 0
              AND ({$fees}) - total_amount > 0.005
        ");
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('credit_applied');
        });
    }
};
