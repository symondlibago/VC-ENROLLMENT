<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            // Adding fields after email_address for logical grouping
            $table->string('fb_acc')->nullable()->after('email_address'); 
            $table->text('fb_description')->nullable()->after('fb_acc');
            $table->string('scholarship')->nullable()->after('enrollment_type');
        });
    }

    public function down(): void
    {
        Schema::table('pre_enrolled_students', function (Blueprint $table) {
            $table->dropColumn(['fb_acc', 'fb_description']);
        });
    }
};