<?php

namespace Database\Seeders;

use App\CourseCategory;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tutor = User::where('email', 'tutor@gmail.com')->first();

        if (! $tutor) {
            $tutor = User::updateOrCreate(
                ['email' => 'tutor@gmail.com'],
                [
                    'name' => 'Fixed Tutor',
                    'password' => 'password',
                    'email_verified_at' => now(),
                ]
            );
            $tutor->syncRoles('tutor');
        }

        $this->upsertCourse($tutor, [
            'title' => 'Basic Mathematics',
            'description' => 'Comprehensive high school mathematics covering algebra, geometry, and problem solving.',
            'thumbnail' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1400&q=80',
            'difficulty' => 'beginner',
            'category' => CourseCategory::BasicMathematics->value,
            'duration_minutes' => 360,
            'is_published' => true,
        ], ['Fixed Scenario Course']);

        $this->upsertCourse($tutor, [
            'title' => 'Advanced Mathematics',
            'description' => 'Advanced high school mathematics featuring calculus fundamentals and real-world applications.',
            'thumbnail' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1400&q=80',
            'difficulty' => 'advanced',
            'category' => CourseCategory::AdvancedMathematics->value,
            'duration_minutes' => 420,
            'is_published' => true,
        ]);
    }

    private function upsertCourse(User $tutor, array $attributes, array $legacyTitles = []): Course
    {
        $titles = array_values(array_unique(array_merge([$attributes['title']], $legacyTitles)));

        $course = Course::query()
            ->where('instructor_id', $tutor->id)
            ->whereIn('title', $titles)
            ->first();

        if ($course) {
            $course->fill($attributes);
            $course->save();

            return $course;
        }

        return Course::create(array_merge($attributes, [
            'instructor_id' => $tutor->id,
        ]));
    }
}
