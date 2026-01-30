<?php

namespace Database\Factories;

use App\Models\Powerup;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Powerup>
 */
class PowerupFactory extends Factory
{
    protected $model = Powerup::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'icon' => 'power',
            'default_limit' => 1,
            'config' => null,
        ];
    }
}
