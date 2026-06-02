<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lms_notifications')) {
            return;
        }

        Schema::create('lms_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');                // recipient
            $table->unsignedBigInteger('subject_id')->nullable(); // optional context
            $table->string('type', 64);                           // e.g. 'assignment_created', 'grade_posted', 'announcement_posted'
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('link', 512)->nullable();              // optional in-app target
            $table->json('payload')->nullable();                  // ids etc.
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
            $table->index('subject_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_notifications');
    }
};
