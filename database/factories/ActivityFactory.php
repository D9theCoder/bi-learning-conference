<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement([
            'lesson_completed',
            'task_completed',
            'achievement_earned',
            'course_enrolled',
            'reward_claimed',
            'level_up',
        ]);

        $descriptions = [
            'lesson_completed' => 'Completed lesson: '.fake()->sentence(3),
            'task_completed' => 'Completed task: '.fake()->sentence(3),
            'achievement_earned' => 'Earned achievement: '.fake()->words(2, true),
            'course_enrolled' => 'Enrolled in '.fake()->sentence(3),
            'reward_claimed' => 'Claimed reward: '.fake()->words(2, true),
            'level_up' => 'Advanced to Level '.fake()->numberBetween(2, 50),
        ];

        $icons = [
            'lesson_completed' => '✅',
            'task_completed' => '🗒️',
            'achievement_earned' => '🏆',
            'course_enrolled' => '📚',
            'reward_claimed' => '🎁',
            'level_up' => '⬆️',
        ];

        return [
            'user_id' => User::factory(),
            'type' => $type,
            'description' => $descriptions[$type],
            'icon' => $icons[$type],
            'metadata' => [],
        ];
    }
}
