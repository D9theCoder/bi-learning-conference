<?php

use App\Models\Assessment;
use App\Models\Attendance;
use App\Models\Course;
use App\Models\CourseContent;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->withoutMiddleware([
        ValidateCsrfToken::class,
        VerifyCsrfToken::class,
    ]);

    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach (['admin', 'tutor', 'student'] as $role) {
        Role::firstOrCreate(['name' => $role]);
    }
});

it('requires authentication', function () {
    $response = $this->get(route('courses'));
    $response->assertRedirect(route('login'));
});

it('renders courses index page', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    Course::factory()->count(5)->create(['is_published' => true]);

    $response = $this->actingAs($user)->get(route('courses'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('courses/index')
        ->has('courses.data', 5)
    );
});

it('filters courses by difficulty', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    Course::factory()->create(['difficulty' => 'beginner', 'is_published' => true]);
    Course::factory()->create(['difficulty' => 'advanced', 'is_published' => true]);

    $response = $this->actingAs($user)->get(route('courses', ['difficulty' => 'beginner']));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('courses.data', 1)
    );
});

it('shows enrolled courses separately from available courses', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $enrolledCourse = Course::factory()->create(['is_published' => true]);
    $otherCourse = Course::factory()->create(['is_published' => true]);

    Enrollment::factory()->for($user)->for($enrolledCourse)->create([
        'progress_percentage' => 50,
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)->get(route('courses'));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('enrolled_courses', 1)
        ->where('enrolled_courses.0.id', $enrolledCourse->id)
        ->where('enrolled_courses.0.user_progress.progress_percentage', 50)
        ->where('courses.data', function ($data) use ($enrolledCourse, $otherCourse) {
            $ids = collect($data)->pluck('id');

            return $ids->contains($otherCourse->id) && ! $ids->contains($enrolledCourse->id);
        })
    );
});

it('allows enrollment in a course', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $course = Course::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('courses.enroll', $course));

    $response->assertRedirect();
    expect(Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists())->toBeTrue();
});

it('prevents duplicate enrollment', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($user)->for($course)->create();

    $response = $this->actingAs($user)
        ->post(route('courses.enroll', $course));

    expect(Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->count())->toBe(1);
});

it('prevents tutors from viewing another tutor course detail', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $otherCourse = Course::factory()->create(); // no instructor or another tutor

    $this->actingAs($tutor)
        ->get(route('courses.show', $otherCourse))
        ->assertForbidden();
});

it('allows tutors to view their own course detail', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $ownCourse = Course::factory()->create(['instructor_id' => $tutor->id]);

    $this->actingAs($tutor)
        ->get(route('courses.show', $ownCourse))
        ->assertSuccessful();
});

it('shows session materials and assessments for enrolled students', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->for($course)->create(['title' => 'Session 1']);
    CourseContent::factory()->for($lesson)->create(['type' => 'link']);
    Assessment::factory()->for($course)->for($lesson)->create();

    Enrollment::factory()->for($student)->for($course)->create(['status' => 'active']);

    $response = $this->actingAs($student)->get(route('courses.show', $course));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('courses/show')
        ->has('course.lessons', 1)
        ->has('course.lessons.0.contents', 1)
        ->has('assessments', 1)
    );
});

it('prevents tutors from enrolling in courses', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create();

    $this->actingAs($tutor)
        ->post(route('courses.enroll', $course))
        ->assertForbidden();
});

it('shows student attendance to the course tutor', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $student = User::factory()->create();
    $student->assignRole('student');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lessons = Lesson::factory()->for($course)->count(2)->create();

    Enrollment::factory()->for($student)->for($course)->create(['status' => 'active']);

    $attendedLesson = $lessons->first();

    Attendance::create([
        'user_id' => $student->id,
        'lesson_id' => $attendedLesson->id,
        'attended_at' => now(),
    ]);

    $response = $this->actingAs($tutor)->get(route('courses.show', $course));

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->where('isTutor', true)
        ->has('students', 1)
        ->where('students.0.id', $student->id)
        ->where('students.0.attendances.0.lesson_id', $attendedLesson->id)
    );
});
