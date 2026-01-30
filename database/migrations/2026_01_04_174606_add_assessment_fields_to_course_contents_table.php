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
        Schema::table('course_contents', function (Blueprint $table) {
            // Add assessment-specific fields
            $table->foreignId('assessment_id')->nullable()->after('type')->constrained()->onDelete('cascade');
            $table->string('assessment_type')->nullable()->after('assessment_id'); // practice, quiz, final_exam
            $table->integer('max_score')->nullable()->after('assessment_type');
            $table->boolean('allow_powerups')->default(true)->after('max_score');
            $table->json('allowed_powerups')->nullable()->after('allow_powerups');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_contents', function (Blueprint $table) {
            $table->dropForeign(['assessment_id']);
            $table->dropColumn([
                'assessment_id',
                'assessment_type',
                'max_score',
                'allow_powerups',
                'allowed_powerups',
            ]);
        });
    }
};
