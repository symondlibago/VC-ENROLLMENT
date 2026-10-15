<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Uniform fabric monitoring.
 *
 * Fabric arrives in rolls (monthly or per semester) and is sold to students by
 * the metre at the cashier. Stock on hand is what was delivered less what was
 * sold, so both sides are kept as their own records and never overwritten.
 *
 * The fabrics themselves live in a table rather than an enum, so another cut
 * (a PE fabric, a new female lower) is a row, not a migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fabric_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            // Below this many metres the page flags the fabric as running low
            $table->decimal('low_stock_meters', 10, 2)->default(50);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('fabric_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fabric_type_id')->constrained()->cascadeOnDelete();
            $table->date('delivery_date');
            $table->unsignedInteger('rolls')->default(0);
            $table->decimal('meters', 10, 2);
            $table->string('supplier')->nullable();
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['fabric_type_id', 'delivery_date']);
            $table->index('delivery_date');
        });

        Schema::create('fabric_purchases', function (Blueprint $table) {
            $table->id();
            // Linked when the student is in the system; the typed-in details are
            // kept either way so the receipt still reads correctly later on.
            $table->foreignId('pre_enrolled_student_id')->nullable()->constrained()->nullOnDelete();
            $table->string('student_name');
            $table->string('student_id_number')->nullable();
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();
            $table->string('or_number');
            $table->date('purchase_date');
            // Kept alongside the line items so the list never has to add them up
            $table->decimal('total_meters', 10, 2)->default(0);
            $table->decimal('amount', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('purchase_date');
            $table->index('or_number');
            $table->index('student_id_number');
        });

        Schema::create('fabric_purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fabric_purchase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fabric_type_id')->constrained()->cascadeOnDelete();
            $table->decimal('meters', 10, 2);
            $table->timestamps();

            $table->index(['fabric_type_id', 'fabric_purchase_id']);
        });

        // The fabrics the school actually stocks. Male and female share one
        // lower cut, so it is a single fabric used by both.
        $now = now();
        DB::table('fabric_types')->insert([
            [
                'code' => 'male_upper',
                'name' => 'Male Upper',
                'description' => 'Upper fabric for the male uniform',
                'low_stock_meters' => 50,
                'sort_order' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'female_upper',
                'name' => 'Female Upper',
                'description' => 'Upper fabric for the female uniform',
                'low_stock_meters' => 50,
                'sort_order' => 2,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'lower',
                'name' => 'Lower',
                'description' => 'Lower fabric, shared by the male and female uniform',
                'low_stock_meters' => 50,
                'sort_order' => 3,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('fabric_purchase_items');
        Schema::dropIfExists('fabric_purchases');
        Schema::dropIfExists('fabric_deliveries');
        Schema::dropIfExists('fabric_types');
    }
};
