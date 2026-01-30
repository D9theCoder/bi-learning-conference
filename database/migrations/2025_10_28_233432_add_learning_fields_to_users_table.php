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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('cohort_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('total_xp')->default(0);
            $table->integer('level')->default(1);
            $table->integer('points_balance')->default(0);
            $table->integer('current_streak')->default(0);
            $table->integer('longest_streak')->default(0);
            $table->date('last_activity_date')->nullable();
            $table->index('cohort_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['cohort_id']);
            $table->dropColumn(['cohort_id', 'total_xp', 'level', 'points_balance', 'current_streak', 'longest_streak', 'last_activity_date']);
        });
    }
};
