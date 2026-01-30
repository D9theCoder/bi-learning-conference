<?php

use App\CourseCategory;
use App\Models\Assessment;
use App\Models\Course;
use App\Models\CourseContent;
use App\Models\Enrollment;
use App\Models\StudentMeetingSchedule;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

it('seeds the fixed scenario data', function () {
    $this->seed(DatabaseSeeder::class);

    $superadmin = User::where('email', 'superadmin@gmail.com')->firstOrFail();
    expect($superadmin->hasRole('admin'))->toBeTrue();

    $student = User::where('email', 'student@gmail.com')->firstOrFail();
    $studentOne = User::where('email', 'student1@gmail.com')->firstOrFail();
    expect($studentOne->hasRole('student'))->toBeTrue();

    $basicCourse = Course::where('title', 'Basic Mathematics')->firstOrFail();
    $advancedCourse = Course::where('title', 'Advanced Mathematics')->firstOrFail();

    expect($basicCourse->category)->toBe(CourseCategory::BasicMathematics->value);
    expect($advancedCourse->category)->toBe(CourseCategory::AdvancedMathematics->value);
    expect($basicCourse->lessons()->count())->toBe(6);
    expect($advancedCourse->lessons()->count())->toBe(7);

    $basicQuiz = Assessment::where('title', 'Quiz - Algebra & Geometry Basics')->firstOrFail();
    $advancedFinal = Assessment::where('title', 'Final Exam - Advanced Mathematics')->firstOrFail();
    expect($basicQuiz->questions()->count())->toBe(10);
    expect($advancedFinal->questions()->count())->toBe(20);

    $basicEnrollment = Enrollment::where('user_id', $student->id)
        ->where('course_id', $basicCourse->id)
        ->firstOrFail();
    $studentOneBasicEnrollment = Enrollment::where('user_id', $studentOne->id)
        ->where('course_id', $basicCourse->id)
        ->firstOrFail();
    $studentOneAdvancedEnrollment = Enrollment::where('user_id', $studentOne->id)
        ->where('course_id', $advancedCourse->id)
        ->firstOrFail();

    expect((float) $basicEnrollment->progress_percentage)->toBe(0.0);
    expect((float) $studentOneBasicEnrollment->progress_percentage)->toBe(50.0);
    expect((float) $studentOneAdvancedEnrollment->progress_percentage)->toBe(0.0);

    expect(StudentMeetingSchedule::where('student_id', $student->id)
        ->where('course_id', $basicCourse->id)
        ->count())->toBe(6);
    expect(StudentMeetingSchedule::where('student_id', $studentOne->id)
        ->where('course_id', $basicCourse->id)
        ->count())->toBe(6);
    expect(StudentMeetingSchedule::where('student_id', $studentOne->id)
        ->where('course_id', $advancedCourse->id)
        ->count())->toBe(7);

    expect(CourseContent::where('type', 'link')
        ->where('url', 'like', '%khanacademy.org%')
        ->exists())->toBeTrue();
});
