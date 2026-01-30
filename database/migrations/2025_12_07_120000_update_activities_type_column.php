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
        if (! Schema::hasTable('activities') || ! Schema::hasColumn('activities', 'type')) {
            return;
        }

        // 1) Add a temporary column to stage existing values.
        Schema::table('activities', function (Blueprint $table) {
            $table->string('type_backup')->nullable()->after('type');
        });

        // 2) Copy current values into the backup column.
        DB::table('activities')->update([
            'type_backup' => DB::raw('type'),
        ]);

        // 3) Drop the constrained enum column.
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        // 4) Re-add `type` as a plain string column to allow new activity kinds.
        Schema::table('activities', function (Blueprint $table) {
            $table->string('type')->default('lesson_completed')->after('user_id');
        });

        // 5) Restore the original values, then clean up the backup.
        DB::table('activities')
            ->whereNotNull('type_backup')
            ->update(['type' => DB::raw('type_backup')]);

        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('type_backup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('activities') || ! Schema::hasColumn('activities', 'type')) {
            return;
        }

        // Recreate the enum column without the new type and migrate data back.
        Schema::table('activities', function (Blueprint $table) {
            $table->string('type_backup')->nullable()->after('type');
        });

        DB::table('activities')->update([
            'type_backup' => DB::raw('type'),
        ]);

        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->enum('type', ['lesson_completed', 'task_completed', 'achievement_earned', 'course_enrolled', 'reward_claimed', 'level_up'])->default('lesson_completed')->after('user_id');
        });

        DB::table('activities')
            ->whereNotNull('type_backup')
            ->update(['type' => DB::raw('type_backup')]);

        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('type_backup');
        });
    }
};

