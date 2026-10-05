<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Credential requests (VIPC-RO-15): a student asks the registrar for documents
 * — transcript, diploma, good moral and so on — which then has to clear the
 * library, the laboratory and the program head, be paid at the cashier, and be
 * released by the registrar with a claim schedule.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credential_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();

            // Linked when the student exists in the system; otherwise the
            // details are typed in, for alumni who graduated before it existed.
            $table->foreignId('pre_enrolled_student_id')->nullable()->constrained()->nullOnDelete();
            $table->string('student_name');
            $table->string('student_id_number')->nullable();
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();
            $table->string('semester')->nullable();
            $table->string('school_year')->nullable();
            $table->string('email')->nullable();
            $table->string('contact_number')->nullable();

            // The requested documents: [{ type, label, pages, remarks }]
            $table->json('credentials');
            // Why they are needed: ['employment', 'enrollment', ...]
            $table->json('purposes')->nullable();
            $table->string('purpose_other')->nullable();
            $table->text('remarks')->nullable();

            $table->string('status')->default('pending')->index();

            // Cashier's record of payment
            $table->decimal('amount', 10, 2)->nullable();
            $table->string('or_number')->nullable();
            $table->date('payment_date')->nullable();

            // Clearance desks, in the order the form is routed
            foreach (['librarian', 'laboratory', 'program_head', 'cashier', 'registrar'] as $step) {
                $table->timestamp("{$step}_approved_at")->nullable();
                $table->foreignId("{$step}_approved_by")->nullable()->constrained('users')->nullOnDelete();
                $table->text("{$step}_remarks")->nullable();
            }

            // Claim stub, filled in by the registrar on release
            $table->date('claim_date')->nullable();
            $table->string('claim_time')->nullable();
            $table->text('release_notes')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamp('email_sent_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credential_requests');
    }
};
