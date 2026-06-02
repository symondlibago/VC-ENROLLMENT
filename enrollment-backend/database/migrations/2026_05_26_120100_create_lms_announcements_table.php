<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lms_announcements')) {
            return;
        }

        Schema::create('lms_announcements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('section_id')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->string('title');
            $table->text('body')->nullable();
            $table->boolean('pinned')->default(false);
            $table->timestamps();

            $table->index('subject_id');
            $table->index('section_id');
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_announcements');
    }
};
