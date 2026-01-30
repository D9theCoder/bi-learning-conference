<?php

namespace Database\Factories;

use App\CourseCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $titles = [
            'Introduction to Algebra',
            'Advanced Calculus Techniques',
            'Quantum Physics Fundamentals',
            'Organic Chemistry Basics',
            'Molecular Biology',
            'Linear Algebra and Matrices',
            'Thermodynamics and Heat Transfer',
            'Chemical Bonding and Reactions',
            'Cell Biology and Genetics',
            'Differential Equations',
        ];

        return [
            'title' => fake()->randomElement($titles),
            'description' => fake()->paragraphs(3, true),
            'thumbnail' => 'https://picsum.photos/seed/'.fake()->uuid().'/800/600',
            'instructor_id' => User::factory(),
            'duration_minutes' => fake()->numberBetween(300, 3000),
            'difficulty' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
            'category' => fake()->randomElement(CourseCategory::values()),
            'is_published' => fake()->boolean(80),
        ];
    }
}
