<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Enrollment>
 */
class EnrollmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['active', 'completed', 'paused']);
        $progress = $status === 'completed' ? 100 : fake()->numberBetween(5, 95);

        return [
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
            'progress_percentage' => $progress,
            'status' => $status,
            'last_activity_at' => fake()->dateTimeBetween('-7 days', 'now'),
            'enrolled_at' => fake()->dateTimeBetween('-60 days', '-1 day'),
            'completed_at' => $status === 'completed' ? fake()->dateTimeBetween('-30 days', 'now') : null,
        ];
    }
}
