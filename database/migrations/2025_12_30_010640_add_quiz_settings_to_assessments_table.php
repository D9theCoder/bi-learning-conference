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
        Schema::table('assessments', function (Blueprint $table) {
            $table->boolean('allow_retakes')->default(false)->after('max_score');
            $table->integer('time_limit_minutes')->nullable()->after('allow_retakes');
            $table->boolean('is_published')->default(false)->after('time_limit_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn(['allow_retakes', 'time_limit_minutes', 'is_published']);
        });
    }
};
