<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Corrects the spelling of the diploma department.
 *
 * The value came from a misspelt option in the Add Instructor dialog — the
 * label read "Diploma" while the value it stored read "deiploma", so nobody
 * saw it until a screen printed the stored value rather than the label.
 *
 * The option is fixed alongside this, so nothing writes the old spelling
 * again. Only this column is touched, and only where it holds that value.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('instructors')->where('department', 'deiploma')->update(['department' => 'diploma']);
    }

    public function down(): void
    {
        DB::table('instructors')->where('department', 'diploma')->update(['department' => 'deiploma']);
    }
};
