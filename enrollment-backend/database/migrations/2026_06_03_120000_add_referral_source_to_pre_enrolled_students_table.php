<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->string('referral_source')->nullable()->after('fb_description');
            $table->string('referral_source_other')->nullable()->after('referral_source');
        });
    }

    public function down(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->dropColumn(['referral_source', 'referral_source_other']);
        });
    }
};
