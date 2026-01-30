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
        Schema::create('assessment_powerup', function (Blueprint $table) {
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('powerup_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('limit')->default(1);

            $table->primary(['assessment_id', 'powerup_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_powerup');
    }
};
