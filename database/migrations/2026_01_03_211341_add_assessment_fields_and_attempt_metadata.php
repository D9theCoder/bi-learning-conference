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
            $table->boolean('is_remedial')->default(false)->after('is_published');
        });

        Schema::table('assessment_attempts', function (Blueprint $table) {
            $table->boolean('is_remedial')->default(false)->after('is_graded');
            $table->integer('points_awarded')->default(0)->after('is_remedial');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_attempts', function (Blueprint $table) {
            $table->dropColumn(['is_remedial', 'points_awarded']);
        });

        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn('is_remedial');
        });
    }
};
