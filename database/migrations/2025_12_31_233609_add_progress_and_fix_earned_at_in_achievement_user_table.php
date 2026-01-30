<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('achievement_user', function (Blueprint $table) {
            // Make earned_at nullable for in-progress achievements
            $table->timestamp('earned_at')->nullable()->default(null)->change();
        });

        // Update existing records: set earned_at to null where progress < target
        DB::table('achievement_user')
            ->join('achievements', 'achievement_user.achievement_id', '=', 'achievements.id')
            ->whereColumn('achievement_user.progress', '<', 'achievements.target')
            ->update(['earned_at' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('achievement_user', function (Blueprint $table) {
            $table->timestamp('earned_at')->useCurrent()->change();
        });
    }
};
