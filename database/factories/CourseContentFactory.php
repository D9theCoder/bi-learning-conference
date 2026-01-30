<?php

namespace Database\Factories;

use App\Models\CourseContent;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseContent>
 */
class CourseContentFactory extends Factory
{
    protected $model = CourseContent::class;

    public function definition(): array
    {
        return [
            'lesson_id' => Lesson::factory(),
            'title' => $this->faker->sentence(3),
            'type' => 'file',
            'file_path' => null,
            'url' => null,
            'description' => $this->faker->sentence(),
            'due_date' => null,
            'duration_minutes' => 30,
            'is_required' => false,
            'order' => 1,
        ];
    }
}

