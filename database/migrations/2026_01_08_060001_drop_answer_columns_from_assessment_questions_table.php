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
        $missingConfigs = DB::table('assessment_questions')
            ->whereNull('answer_config')
            ->count();

        if ($missingConfigs > 0) {
            throw new RuntimeException('Cannot drop answer columns while assessment_questions.answer_config is null.');
        }

        Schema::table('assessment_questions', function (Blueprint $table) {
            $table->dropColumn(['options', 'correct_answer']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_questions', function (Blueprint $table) {
            $table->json('options')->nullable()->after('question');
            $table->text('correct_answer')->nullable()->after('options');
        });
    }
};
