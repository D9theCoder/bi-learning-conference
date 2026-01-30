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
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('icon');
            $table->enum('rarity', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
            $table->text('criteria')->nullable();
            $table->integer('xp_reward')->default(0);
            // $table->string('category')->default('General'); // ! New Column
            // $table->integer('target')->default(1);          // ! New Column
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
