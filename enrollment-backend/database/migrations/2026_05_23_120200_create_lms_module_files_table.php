<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lms_module_files')) {
            return;
        }

        Schema::create('lms_module_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id');
            $table->unsignedBigInteger('uploaded_by');
            $table->string('original_name');
            $table->string('storage_path', 1024);
            $table->string('mime_type', 191);
            $table->unsignedBigInteger('size_bytes');
            $table->string('extension', 16);
            $table->timestamps();

            $table->index('module_id');
            $table->foreign('module_id')->references('id')->on('lms_modules')->cascadeOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_module_files');
    }
};
