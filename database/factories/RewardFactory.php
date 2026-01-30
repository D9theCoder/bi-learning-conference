<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Reward>
 */
class RewardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $rewards = [
            ['name' => '10% Course Discount', 'icon' => '🎟️', 'cost' => 500],
            ['name' => 'Premium Badge', 'icon' => '⭐', 'cost' => 1000],
            ['name' => 'Free Month Subscription', 'icon' => '🎁', 'cost' => 2500],
            ['name' => 'Exclusive Webinar Access', 'icon' => '🎥', 'cost' => 750],
            ['name' => 'Course Certificate', 'icon' => '📜', 'cost' => 300],
            ['name' => 'Merch: T-Shirt', 'icon' => '👕', 'cost' => 1500],
        ];

        $reward = fake()->randomElement($rewards);

        return [
            'name' => $reward['name'],
            'description' => fake()->sentence(),
            'cost' => $reward['cost'],
            'icon' => $reward['icon'],
            'category' => fake()->randomElement(['Discounts', 'Merch', 'Access', 'Certificates']),
            'is_active' => fake()->boolean(90),
            'stock' => fake()->boolean(70) ? fake()->numberBetween(5, 100) : null,
        ];
    }
}
