<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Half-finished transcripts, kept so they can be finished another day.
 *
 * A transcript for an older student is not one sitting's work: records have to
 * be dug out of the filing cabinet, and the registrar types most of it by
 * hand. Closing the window used to throw all of it away. A draft holds the
 * whole form as it stood, so tomorrow starts where yesterday stopped.
 *
 * The form is stored as one JSON document rather than shredded across
 * columns. Nothing queries inside it — a draft is only ever written whole and
 * read whole — and the transcript's shape is the registrar's to change
 * without a migration every time a field moves.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transcript_drafts', function (Blueprint $table) {
            $table->id();

            // Whose draft. Drafts go when the account does: an unfinished form
            // is personal working notes, not a record of anything.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // The student it is for, when there is one on file. An alumnus
            // from before the system is typed from scratch and has none.
            $table->foreignId('pre_enrolled_student_id')->nullable()
                ->constrained()->nullOnDelete();

            // What the registrar sees in the list before opening it
            $table->string('title');

            $table->json('payload');

            $table->timestamps();

            // The list is always "my drafts, most recently touched first"
            $table->index(['user_id', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transcript_drafts');
    }
};
