<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Student clearance (VIPC student's clearance form).
 *
 * A student carries one clearance per term they are enrolled in: college
 * takes one per semester, Senior High one for the whole year, and summer
 * none. Each clearance holds one row per signatory on the paper form, so an
 * approval is a record with a name and a timestamp against it rather than a
 * tick in a column — which is what makes "who has not signed yet" a question
 * the database can answer.
 *
 * Who may sign for which line lives in a pivot rather than on the user's
 * role, because one person can hold two lines (the registrar is also the
 * guidance counsellor) and because a signatory may be an instructor, admin
 * staff, or neither.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clearance_roles', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            // The cashier signs last; the gate is enforced in the service,
            // this only marks which line it is
            $table->boolean('is_final')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        // Who may sign which line. A user with no rows here has no business
        // on the clearance board at all.
        Schema::create('clearance_role_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clearance_role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['clearance_role_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('clearances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_enrolled_student_id')->constrained()->cascadeOnDelete();
            $table->string('school_year', 20);
            // '1st Semester' / '2nd Semester' for college, 'Whole Year' for
            // Senior High. A sentinel rather than NULL, because MySQL lets
            // two NULLs through a unique index and would allow a duplicate.
            $table->string('semester', 30);
            $table->string('year_level', 50)->nullable();
            $table->enum('status', ['pending', 'cleared'])->default('pending');
            $table->timestamp('cleared_at')->nullable();
            $table->timestamps();

            $table->unique(['pre_enrolled_student_id', 'school_year', 'semester'], 'clearance_student_term');
            $table->index(['school_year', 'semester', 'status']);
            $table->index('status');
        });

        Schema::create('clearance_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clearance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('clearance_role_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending', 'approved'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            // An admin signing because the holder is away. Kept so an audit
            // can tell a real signature from a stand-in.
            $table->boolean('on_behalf')->default(false);
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['clearance_id', 'clearance_role_id'], 'clearance_item_unique');
            // Drives "students still waiting on me", the approver's main view
            $table->index(['clearance_role_id', 'status']);
        });

        // One permanent code per student rather than one per term: the
        // student keeps the same card and the scan resolves to whichever
        // clearance is current.
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->string('clearance_qr_token', 64)->nullable()->unique()->after('signature');
        });

        DB::table('pre_enrolled_students')->orderBy('id')->chunkById(500, function ($students) {
            foreach ($students as $student) {
                DB::table('pre_enrolled_students')
                    ->where('id', $student->id)
                    ->update(['clearance_qr_token' => bin2hex(random_bytes(16))]);
            }
        });

        $now = now();

        // The signatories on the printed form, in the order they appear on it.
        // The four laboratory lines are separate roles because the form has
        // four separate signature lines for them.
        $roles = [
            ['school_facilities', 'School Facilities In-Charge', null],
            ['it_officer', 'IT Officer / Computer Lab In-Charge', null],
            ['lab_hrs_hm', 'HRS / HM Laboratory', 'Hotel and Restaurant Services, Hotel Management'],
            ['lab_dht_kitchen', 'DHT / Kitchen Laboratory', 'Diploma in Hospitality, Kitchen'],
            ['lab_fbs_hsk', 'FBS / HSK Laboratory', 'Food and Beverage Services, Housekeeping'],
            ['lab_fo_speech', 'FO / Speech Laboratory', 'Front Office, Speech Laboratory'],
            ['security', 'Security Personnel', null],
            ['vcssg_president', 'VCSSG President', null],
            ['vcssg_treasurer', 'VCSSG Treasurer', null],
            ['school_nurse', 'School Nurse', null],
            ['librarian', 'Librarian', null],
            ['academic_in_charge', 'Academic In-Charge', null],
            ['guidance', 'Guidance Counselor', null],
            ['registrar', 'Registrar', null],
            ['operations_officer', 'Operations Officer', null],
            ['cashier', 'Assessment Office / Cashier', 'Signs last, once every other line is cleared'],
        ];

        DB::table('clearance_roles')->insert(
            collect($roles)->map(fn ($role, $index) => [
                'code' => $role[0],
                'name' => $role[1],
                'description' => $role[2],
                'is_final' => $role[0] === 'cashier',
                'sort_order' => $index + 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all()
        );
    }

    public function down(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->dropColumn('clearance_qr_token');
        });

        Schema::dropIfExists('clearance_items');
        Schema::dropIfExists('clearances');
        Schema::dropIfExists('clearance_role_user');
        Schema::dropIfExists('clearance_roles');
    }
};
