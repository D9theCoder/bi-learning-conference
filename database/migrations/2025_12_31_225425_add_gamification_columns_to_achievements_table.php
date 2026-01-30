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
        Schema::table('achievements', function (Blueprint $table) {
            $table->string('category')->default('general')->after('xp_reward');
            $table->integer('target')->default(1)->after('category');
        });

        Schema::table('achievement_user', function (Blueprint $table) {
            $table->integer('progress')->default(0)->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('achievements', function (Blueprint $table) {
            $table->dropColumn(['category', 'target']);
        });

        Schema::table('achievement_user', function (Blueprint $table) {
            $table->dropColumn('progress');
        });
    }
};
