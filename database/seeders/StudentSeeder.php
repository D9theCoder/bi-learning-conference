<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $student = User::where('email', 'student@gmail.com')->first();
        $studentOne = User::where('email', 'student1@gmail.com')->first();
        $basicCourse = Course::where('title', 'Basic Mathematics')->first();
        $advancedCourse = Course::where('title', 'Advanced Mathematics')->first();

        if ($student && $basicCourse) {
            $this->upsertEnrollment($student, $basicCourse, 0);
        }

        if ($studentOne && $basicCourse) {
            $this->upsertEnrollment($studentOne, $basicCourse, 50);
        }

        if ($studentOne && $advancedCourse) {
            $this->upsertEnrollment($studentOne, $advancedCourse, 0);
        }
    }

    private function upsertEnrollment(User $student, Course $course, float $progressPercentage): Enrollment
    {
        return Enrollment::updateOrCreate(
            ['user_id' => $student->id, 'course_id' => $course->id],
            [
                'status' => 'active',
                'enrolled_at' => now(),
                'progress_percentage' => $progressPercentage,
            ]
        );
    }
}
