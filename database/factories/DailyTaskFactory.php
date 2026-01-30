<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DailyTask>
 */
class DailyTaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isCompleted = fake()->boolean(40);

        return [
            'user_id' => User::factory(),
            'title' => fake()->randomElement([
                'Complete Introduction to Variables',
                'Watch Functions and Methods',
                'Practice Data Structures',
                'Read about Algorithms',
                'Take the Weekly Quiz',
            ]),
            'description' => fake()->sentence(),
            'type' => fake()->randomElement(['lesson', 'quiz', 'practice', 'reading']),
            'lesson_id' => fake()->boolean(60) ? Lesson::factory() : null,
            'estimated_minutes' => fake()->randomElement([15, 30, 45, 60]),
            'is_completed' => $isCompleted,
            'completed_at' => $isCompleted ? fake()->dateTimeBetween('today', 'now') : null,
            'due_date' => fake()->dateTimeBetween('today', '+7 days'),
        ];
    }
}
