<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lms_assignments')) {
            return;
        }

        Schema::create('lms_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id');
            $table->unsignedBigInteger('created_by');
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->dateTime('due_at')->nullable();
            $table->unsignedSmallInteger('max_score')->default(100);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index('module_id');
            $table->foreign('module_id')->references('id')->on('lms_modules')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_assignments');
    }
};
