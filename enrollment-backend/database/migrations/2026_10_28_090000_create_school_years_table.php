<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The school years the registrar can enrol into.
 *
 * Until now a new year meant editing the arrays in the enrolment screens by
 * hand. The rows here are merged with those built-in years rather than
 * replacing them, so nothing that already works stops working and the list
 * only ever grows.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_years', function (Blueprint $table) {
            $table->id();
            $table->string('name', 20)->unique();
            // Unticked hides it from the pickers without losing the records
            // already filed against it
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });

        $now = now();

        // Every year the school already has students in, plus the two that
        // were written into the enrolment form, so the list starts complete
        $existing = DB::table('pre_enrolled_students')
            ->whereNotNull('school_year')
            ->where('school_year', '!=', '')
            ->distinct()
            ->pluck('school_year')
            ->all();

        $years = collect(array_merge($existing, ['2025-2026', '2026-2027', '2027-2028']))
            ->map(fn ($year) => trim((string) $year))
            ->filter()
            ->unique()
            ->sortDesc()
            ->values();

        DB::table('school_years')->insert(
            $years->map(fn ($year) => [
                'name' => $year,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all()
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('school_years');
    }
};
