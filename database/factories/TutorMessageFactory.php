<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TutorMessage>
 */
class TutorMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tutor_id' => User::factory(),
            'user_id' => User::factory(),
            'content' => fake()->paragraph(),
            'is_read' => fake()->boolean(50),
            'sent_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ];
    }
}
