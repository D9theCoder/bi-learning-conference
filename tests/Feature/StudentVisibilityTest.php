<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('admin sees all students', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    User::factory()->count(5)->create()->each(fn ($u) => $u->assignRole('student'));

    $response = $this->actingAs($admin)->get(route('students'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('students/index')
        ->has('students.data', 5)
    );
});

it('admin sees student gamification stats in payload', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $student = User::factory()->create([
        'name' => 'Stat Student',
        'level' => 7,
        'points_balance' => 240,
        'total_xp' => 1800,
    ]);
    $student->assignRole('student');

    $response = $this->actingAs($admin)->get(route('students', [
        'search' => 'Stat Student',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('students/index')
        ->has('students.data', 1)
        ->where('students.data.0.id', $student->id)
        ->where('students.data.0.level', 7)
        ->where('students.data.0.points_balance', 240)
        ->where('students.data.0.total_xp', 1800)
        ->where('students.data.0.enrollments_count', 0)
        ->where('students.data.0.active_enrollments_count', 0)
    );
});

it('tutor with no enrollments should see NO students', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    // Create some students that exist in the system
    User::factory()->count(5)->create()->each(fn ($u) => $u->assignRole('student'));

    $response = $this->actingAs($tutor)->get(route('students'));

    $response->assertSuccessful();
    // VULNERABILITY CHECK: Currently this will likely show 5 students
    // We expect 0 students for a tutor with no courses/enrollments
    $response->assertInertia(fn (Assert $page) => $page
        ->component('students/index')
        ->has('students.data', 0)
    );
});

it('tutor sees only enrolled students', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->for($tutor, 'instructor')->create();

    $myStudent = User::factory()->create();
    $myStudent->assignRole('student');
    Enrollment::factory()->for($myStudent)->for($course)->create();

    $otherStudent = User::factory()->create();
    $otherStudent->assignRole('student');

    $response = $this->actingAs($tutor)->get(route('students'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('students/index')
        ->has('students.data', 1)
        ->where('students.data.0.id', $myStudent->id)
    );
});

it('admin sees enrollment details with course info and progress', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $student = User::factory()->create([
        'name' => 'Enrolled Student',
    ]);
    $student->assignRole('student');

    $course1 = Course::factory()->create(['title' => 'Course One']);
    $course2 = Course::factory()->create(['title' => 'Course Two']);

    Enrollment::factory()->for($student)->for($course1)->create([
        'progress_percentage' => 45,
        'status' => 'active',
    ]);

    Enrollment::factory()->for($student)->for($course2)->create([
        'progress_percentage' => 100,
        'status' => 'completed',
    ]);

    $response = $this->actingAs($admin)->get(route('students', [
        'search' => 'Enrolled Student',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('students/index')
        ->has('students.data', 1)
        ->where('students.data.0.id', $student->id)
        ->where('students.data.0.enrollments_count', 2)
        ->has('students.data.0.enrollments', 2)
        ->where('students.data.0.enrollments.0.course.title', fn ($title) => in_array($title, ['Course One', 'Course Two']))
        ->where('students.data.0.enrollments.0.status', fn ($status) => in_array($status, ['active', 'completed']))
        ->has('students.data.0.enrollments.0', fn (Assert $enrollment) => $enrollment
            ->has('id')
            ->has('course.id')
            ->has('course.title')
            ->has('progress_percentage')
            ->has('status')
        )
    );
});

it('tutor sees enrollment details only for their courses', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $student = User::factory()->create([
        'name' => 'Multi-Course Student',
    ]);
    $student->assignRole('student');

    // Tutor's course
    $tutorCourse = Course::factory()->for($tutor, 'instructor')->create(['title' => 'Tutor Course']);

    // Another tutor's course
    $otherTutor = User::factory()->create();
    $otherTutor->assignRole('tutor');
    $otherCourse = Course::factory()->for($otherTutor, 'instructor')->create(['title' => 'Other Course']);

    // Enroll student in both courses
    Enrollment::factory()->for($student)->for($tutorCourse)->create([
        'progress_percentage' => 60,
        'status' => 'active',
    ]);

    Enrollment::factory()->for($student)->for($otherCourse)->create([
        'progress_percentage' => 30,
        'status' => 'active',
    ]);

    $response = $this->actingAs($tutor)->get(route('students', [
        'search' => 'Multi-Course Student',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('students/index')
        ->has('students.data', 1)
        ->where('students.data.0.id', $student->id)
        ->has('students.data.0.enrollments', 1) // Only see tutor's course
        ->where('students.data.0.enrollments.0.course.title', 'Tutor Course')
        ->where('students.data.0.enrollments.0.progress_percentage', fn ($value) => (float) $value === 60.0)
        ->where('students.data.0.enrollments.0.status', 'active')
    );
});
