<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Student ID monitoring.
 *
 * Every physical card the school hands out is its own record, so a student who
 * loses an ID keeps the history of the one before it. The records carry the
 * school year they belong to, which is what makes the board a per-year count
 * instead of a running total that has to be wiped each June.
 *
 * Slings and holders are stocked the same way the uniform fabric is: what came
 * in less what went out, both kept as their own rows and never overwritten.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('id_card_issuances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_enrolled_student_id')->constrained()->cascadeOnDelete();
            $table->string('school_year', 20);
            // 1 is the student's first card that year; 2 and up are replacements
            $table->unsignedSmallInteger('sequence')->default(1);
            $table->enum('reason', ['initial', 'lost', 'damaged', 'renewal', 'correction'])->default('initial');
            $table->enum('status', ['pending', 'printed', 'released', 'lost', 'voided'])->default('pending');

            $table->timestamp('printed_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamp('reported_lost_at')->nullable();

            // Who physically took the card, when it was not the student
            $table->string('received_by')->nullable();
            // A replacement is usually paid for; the first card is not
            $table->decimal('fee', 10, 2)->nullable();
            $table->string('or_number')->nullable();
            $table->text('remarks')->nullable();

            $table->foreignId('printed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // One card per sequence number per year — a double-click cannot
            // quietly create a second "first card"
            $table->unique(['pre_enrolled_student_id', 'school_year', 'sequence'], 'id_issuance_student_year_seq');
            $table->index(['school_year', 'status']);
            $table->index(['school_year', 'reason']);
            $table->index('released_at');
        });

        Schema::create('id_supply_items', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('category', ['sling', 'holder', 'card', 'other'])->default('other');
            $table->string('description')->nullable();
            // Below this many pieces the page flags the item as running low
            $table->unsignedInteger('low_stock_quantity')->default(50);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('id_supply_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_supply_item_id')->constrained()->cascadeOnDelete();
            $table->date('delivery_date');
            $table->unsignedInteger('quantity');
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->string('supplier')->nullable();
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['id_supply_item_id', 'delivery_date']);
            $table->index('delivery_date');
        });

        Schema::create('id_supply_issuances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_supply_item_id')->constrained()->cascadeOnDelete();
            // Set when the sling went out with a card; a student replacing only
            // a worn sling has no card record to point at
            $table->foreignId('id_card_issuance_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('pre_enrolled_student_id')->nullable()->constrained()->nullOnDelete();
            $table->string('school_year', 20)->nullable();
            $table->date('issued_on');
            $table->unsignedInteger('quantity')->default(1);
            $table->enum('reason', ['with_id', 'replacement', 'sale', 'loss', 'adjustment'])->default('with_id');
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('or_number')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['id_supply_item_id', 'issued_on']);
            $table->index(['school_year', 'id_supply_item_id']);
            $table->index('issued_on');
        });

        $now = now();

        DB::table('id_supply_items')->insert([
            [
                'code' => 'sling',
                'name' => 'ID Sling',
                'category' => 'sling',
                'description' => 'Lanyard issued with the student ID',
                'low_stock_quantity' => 50,
                'sort_order' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'holder',
                'name' => 'ID Holder',
                'category' => 'holder',
                'description' => 'Plastic case the ID card sits in',
                'low_stock_quantity' => 50,
                'sort_order' => 2,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // The cards already handed out, so the first year on the new board does
        // not start blank. Students still waiting get no row: a card that was
        // never printed is the absence of a record, not a record of nothing.
        DB::statement("
            INSERT INTO id_card_issuances
                (pre_enrolled_student_id, school_year, sequence, reason, status,
                 printed_at, released_at, created_at, updated_at)
            SELECT
                s.id,
                COALESCE(NULLIF(s.school_year, ''), ?),
                1,
                'initial',
                CASE WHEN s.id_status = 'Released' THEN 'released' ELSE 'printed' END,
                s.id_printed_at,
                s.id_released_at,
                ?,
                ?
            FROM pre_enrolled_students s
            WHERE s.id_status IN ('Printed', 'Released')
        ", [$this->fallbackSchoolYear(), $now, $now]);
    }

    public function down(): void
    {
        Schema::dropIfExists('id_supply_issuances');
        Schema::dropIfExists('id_supply_deliveries');
        Schema::dropIfExists('id_supply_items');
        Schema::dropIfExists('id_card_issuances');
    }

    /** For the odd student row with no school year recorded against it. */
    private function fallbackSchoolYear(): string
    {
        $latest = DB::table('pre_enrolled_students')
            ->whereNotNull('school_year')
            ->where('school_year', '!=', '')
            ->orderByDesc('school_year')
            ->value('school_year');

        if ($latest) {
            return $latest;
        }

        $year = (int) date('n') >= 6 ? (int) date('Y') : (int) date('Y') - 1;

        return $year . '-' . ($year + 1);
    }
};
