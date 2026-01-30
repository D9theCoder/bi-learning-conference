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
        Schema::table('quiz_attempt_powerups', function (Blueprint $table) {
            $table->dropForeign(['quiz_attempt_id']);
        });

        $driver = DB::getDriverName();
        $quizAttemptPowerupIndex = 'quiz_attempt_powerups_quiz_attempt_id_powerup_id_index';

        if ($driver === 'mysql') {
            $indexExists = DB::selectOne(
                'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
                ['quiz_attempt_powerups', $quizAttemptPowerupIndex]
            );

            if ($indexExists) {
                DB::statement("DROP INDEX {$quizAttemptPowerupIndex} ON quiz_attempt_powerups");
            }
        } else {
            DB::statement("DROP INDEX IF EXISTS {$quizAttemptPowerupIndex}");
        }

        Schema::rename('quiz_questions', 'assessment_questions');
        Schema::rename('quiz_attempts', 'assessment_attempts');
        Schema::rename('quiz_attempt_powerups', 'assessment_attempt_powerups');

        DB::statement('ALTER TABLE assessment_attempt_powerups RENAME COLUMN quiz_attempt_id TO assessment_attempt_id');

        Schema::table('assessment_attempt_powerups', function (Blueprint $table) {
            $table->foreign('assessment_attempt_id')
                ->references('id')
                ->on('assessment_attempts')
                ->cascadeOnDelete();
            $table->index(['assessment_attempt_id', 'powerup_id'], 'assessment_attempt_powerup_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_attempt_powerups', function (Blueprint $table) {
            $table->dropForeign(['assessment_attempt_id']);
        });

        $driver = DB::getDriverName();
        $assessmentAttemptPowerupIndex = 'assessment_attempt_powerup_idx';

        if ($driver === 'mysql') {
            $indexExists = DB::selectOne(
                'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
                ['assessment_attempt_powerups', $assessmentAttemptPowerupIndex]
            );

            if ($indexExists) {
                DB::statement("DROP INDEX {$assessmentAttemptPowerupIndex} ON assessment_attempt_powerups");
            }
        } else {
            DB::statement("DROP INDEX IF EXISTS {$assessmentAttemptPowerupIndex}");
        }

        DB::statement('ALTER TABLE assessment_attempt_powerups RENAME COLUMN assessment_attempt_id TO quiz_attempt_id');

        Schema::rename('assessment_attempts', 'quiz_attempts');
        Schema::rename('assessment_attempt_powerups', 'quiz_attempt_powerups');
        Schema::rename('assessment_questions', 'quiz_questions');

        Schema::table('quiz_attempt_powerups', function (Blueprint $table) {
            $table->foreign('quiz_attempt_id')
                ->references('id')
                ->on('quiz_attempts')
                ->cascadeOnDelete();
            $table->index(['quiz_attempt_id', 'powerup_id'], 'quiz_attempt_powerup_idx');
        });
    }
};
