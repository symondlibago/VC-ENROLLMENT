<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lms_modules')) {
            return;
        }

        Schema::create('lms_modules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('created_by');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('order_index')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index('subject_id');
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_modules');
    }
};
