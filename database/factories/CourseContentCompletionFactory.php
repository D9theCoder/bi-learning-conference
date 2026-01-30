<?php

namespace Database\Factories;

use App\Models\CourseContent;
use App\Models\CourseContentCompletion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseContentCompletion>
 */
class CourseContentCompletionFactory extends Factory
{
    protected $model = CourseContentCompletion::class;

    public function definition(): array
    {
        return [
            'course_content_id' => CourseContent::factory(),
            'user_id' => User::factory(),
            'completed_at' => now(),
        ];
    }
}

