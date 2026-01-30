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
            // Weight percentage for final exam (e.g., 80 means final exam is worth 80% of final score)
            // Only used for final_exam type, defaults to 50 for backward compatibility
            // The `after` modifier is MySQL-specific; avoid calling it for SQLite.
            if (Schema::getConnection()->getDriverName() === 'mysql') {
                $table->integer('weight_percentage')->nullable()->default(null)->after('is_remedial');
            } else {
                // For sqlite and other drivers, add a nullable column without `after`
                $table->integer('weight_percentage')->nullable()->default(null);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            // Dropping columns on sqlite may require doctrine/dbal; attempt drop for all drivers.
            if (Schema::getConnection()->getDriverName() === 'sqlite') {
                // If doctrine/dbal isn't available, this may still fail; guard so migrations won't run DB-specific SQL elsewhere.
                $table->dropColumn('weight_percentage');
            } else {
                $table->dropColumn('weight_percentage');
            }
        });
    }
};
