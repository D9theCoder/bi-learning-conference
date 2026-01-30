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
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn([
                'meeting_url',
                'meeting_start_time',
                'meeting_end_time',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('meeting_url')->nullable()->after('video_url');
            $table->dateTime('meeting_start_time')->nullable()->after('meeting_url');
            $table->dateTime('meeting_end_time')->nullable()->after('meeting_start_time');
        });
    }
};
