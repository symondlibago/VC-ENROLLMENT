<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            // Add identification fields after educational background
            $table->string('id_photo')->nullable()->after('college_date_completed');
            $table->string('signature')->nullable()->after('id_photo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->dropColumn(['id_photo', 'signature']);
        });
    }
};