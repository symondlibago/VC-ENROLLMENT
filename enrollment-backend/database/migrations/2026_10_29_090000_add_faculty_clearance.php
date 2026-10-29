<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Faculty clearance (VIPC faculty clearance form).
 *
 * An instructor clears each semester the same way a student does, so this
 * reuses the machinery rather than growing a parallel copy of it: the same
 * `clearance_items` rows, the same approve / bulk-approve / cashier-last
 * rules, the same signatory pivot. Only two things actually differ, and both
 * are handled here.
 *
 *  - Who the clearance belongs to. `clearances` gains a nullable instructor
 *    alongside the now-nullable student; exactly one is ever set, and each
 *    has its own unique index so neither can be filed twice for a term.
 *
 *  - Which lines apply. `clearance_roles` gains a scope, so the student's
 *    sixteen and the faculty's eight live in one table without either
 *    appearing on the other's form.
 *
 * The faculty form also lets the Registrar sign the TESDA In-Charge line,
 * which is what `alt_role_id` is for.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clearance_roles', function (Blueprint $table) {
            // Existing rows are all student lines, which the default covers
            $table->enum('scope', ['student', 'faculty'])->default('student')->after('description');
            // A second line whose holders may also sign this one. The faculty
            // TESDA In-Charge line, which the Registrar may sign in their
            // place — not a general co-signing rule, just that one case.
            $table->foreignId('alt_role_id')->nullable()->after('scope')
                ->constrained('clearance_roles')->nullOnDelete();

            $table->index(['scope', 'is_active', 'sort_order'], 'clearance_roles_scope_index');
        });

        // Raw, because making a constrained column nullable through the
        // schema builder needs doctrine/dbal. A foreign key already permits
        // NULL, so the constraint itself does not have to be touched.
        DB::statement('ALTER TABLE clearances MODIFY pre_enrolled_student_id BIGINT UNSIGNED NULL');

        Schema::table('clearances', function (Blueprint $table) {
            $table->foreignId('instructor_id')->nullable()->after('pre_enrolled_student_id')
                ->constrained()->cascadeOnDelete();

            // MySQL lets a unique index hold any number of NULLs, so the
            // student rows (NULL instructor) and the faculty rows (NULL
            // student) sit in the same table without colliding.
            $table->unique(['instructor_id', 'school_year', 'semester'], 'clearance_faculty_term');
        });

        $now = now();
        $roleId = fn (string $code) => DB::table('clearance_roles')->where('code', $code)->value('id');

        // The lines on the faculty form, in the order they are printed.
        // The President is deliberately absent — the College does not route
        // faculty clearance through that signature.
        $lines = [
            ['code' => 'faculty_librarian', 'name' => 'Librarian'],
            ['code' => 'faculty_academic_secretary', 'name' => 'Academic Secretary'],
            ['code' => 'faculty_laboratory', 'name' => 'Laboratory'],
            ['code' => 'faculty_program_head', 'name' => 'Program Head'],
            ['code' => 'faculty_registrar', 'name' => 'Registrar'],
            ['code' => 'faculty_operations_officer', 'name' => 'Operations Officer'],
            [
                'code' => 'faculty_tesda_in_charge',
                'name' => 'TESDA In-Charge',
                'description' => 'The Registrar may also sign this line.',
            ],
            [
                'code' => 'faculty_cashier',
                'name' => 'Cashier',
                'description' => 'Signs last, once every other line is in.',
                'is_final' => true,
            ],
        ];

        foreach ($lines as $index => $line) {
            DB::table('clearance_roles')->updateOrInsert(
                ['code' => $line['code']],
                [
                    'name' => $line['name'],
                    'description' => $line['description'] ?? null,
                    'scope' => 'faculty',
                    'is_final' => $line['is_final'] ?? false,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // Set after the insert, since it points at a row created in the same
        // loop and the Registrar line may come after the TESDA one
        DB::table('clearance_roles')
            ->where('code', 'faculty_tesda_in_charge')
            ->update(['alt_role_id' => $roleId('faculty_registrar')]);
    }

    public function down(): void
    {
        DB::table('clearance_roles')->where('scope', 'faculty')->update(['alt_role_id' => null]);
        DB::table('clearance_roles')->where('scope', 'faculty')->delete();

        Schema::table('clearances', function (Blueprint $table) {
            $table->dropUnique('clearance_faculty_term');
            $table->dropConstrainedForeignId('instructor_id');
        });

        DB::statement('ALTER TABLE clearances MODIFY pre_enrolled_student_id BIGINT UNSIGNED NOT NULL');

        Schema::table('clearance_roles', function (Blueprint $table) {
            $table->dropIndex('clearance_roles_scope_index');
            $table->dropConstrainedForeignId('alt_role_id');
            $table->dropColumn('scope');
        });
    }
};
