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
        if (Schema::hasColumn('users', 'cohort_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['cohort_id']);
                $table->dropIndex(['cohort_id']);
                $table->dropColumn('cohort_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('users', 'cohort_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('cohort_id')->nullable()->constrained()->onDelete('set null');
                $table->index('cohort_id');
            });
        }
    }
};
