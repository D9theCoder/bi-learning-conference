<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Lesson>
 */
class LessonFactory extends Factory
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
            'title' => 'Lesson: '.fake()->sentence(4),
            'description' => fake()->paragraph(),
            'content' => fake()->paragraphs(5, true),
            'duration_minutes' => fake()->numberBetween(10, 90),
            'order' => fake()->numberBetween(1, 20),
            'video_url' => fake()->boolean(70) ? 'https://www.youtube.com/watch?v='.fake()->lexify('???????????') : null,
        ];
    }
}
