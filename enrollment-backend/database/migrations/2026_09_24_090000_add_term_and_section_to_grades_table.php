<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A grade row only knew student + subject + instructor, so once a student
 * re-enrolled (which re-syncs student_subject and section_student) there was no
 * way to tell which term or section the grade belonged to — and the student
 * disappeared from the previous term's roster and exports.
 *
 * These columns make each grade row self-describing. They are nullable so old
 * rows stay valid; a separate backfill fills in what can be recovered.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->unsignedBigInteger('section_id')->nullable()->after('instructor_id');
            $table->string('school_year')->nullable()->after('section_id');
            $table->string('semester')->nullable()->after('school_year');
            $table->string('year')->nullable()->after('semester');

            $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();
            $table->index(['subject_id', 'instructor_id', 'school_year', 'semester'], 'grades_term_lookup_index');
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropIndex('grades_term_lookup_index');
            $table->dropColumn(['section_id', 'school_year', 'semester', 'year']);
        });
    }
};
