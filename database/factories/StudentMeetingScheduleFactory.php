<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudentMeetingSchedule>
 */
class StudentMeetingScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'lesson_id' => null,
            'student_id' => User::factory(),
            'title' => fake()->sentence(3),
            'meeting_url' => fake()->optional()->url(),
            'scheduled_at' => fake()->dateTimeBetween('now', '+1 month'),
            'duration_minutes' => fake()->optional()->numberBetween(30, 120),
            'notes' => fake()->optional()->paragraph(),
            'status' => fake()->randomElement(['scheduled', 'completed', 'cancelled']),
        ];
    }
}
