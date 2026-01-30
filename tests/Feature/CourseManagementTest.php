<?php

use App\CourseCategory;
use App\Models\Assessment;
use App\Models\Course;
use App\Models\CourseContent;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

use function Pest\Laravel\get;
use function Pest\Laravel\post;

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

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('allows tutors to create lessons for their course', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    $response = $this->actingAs($tutor)->post(route('courses.manage.lessons.store', $course), [
        'title' => 'Lesson 1',
        'description' => 'Intro lesson',
        'order' => 1,
        'duration_minutes' => 45,
        'video_url' => 'https://example.com/video',
    ]);

    $response->assertRedirect(route('courses.manage.edit', $course));
    expect(Lesson::where('course_id', $course->id)->where('title', 'Lesson 1')->exists())->toBeTrue();
});

it('prevents tutors from managing lessons on other tutor courses', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $otherTutor = User::factory()->create();
    $otherTutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $otherTutor->id]);

    $this->actingAs($tutor)
        ->post(route('courses.manage.lessons.store', $course), [
            'title' => 'Blocked lesson',
            'order' => 1,
        ])
        ->assertForbidden();
});

it('allows tutors to add content to their lessons', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();

    $response = $this->actingAs($tutor)->post(
        route('courses.manage.contents.store', [$course, $lesson]),
        [
            'title' => 'Watch video',
            'type' => 'video',
            'url' => 'https://example.com/watch',
            'duration_minutes' => 10,
            'order' => 1,
            'is_required' => true,
        ],
    );

    $response->assertRedirect(route('courses.manage.edit', $course));

    expect(CourseContent::where('lesson_id', $lesson->id)->where('title', 'Watch video')->exists())->toBeTrue();
});

it('creates assessments without course contents when added via course management', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();

    $response = $this->actingAs($tutor)->post(
        route('courses.manage.contents.store', [$course, $lesson]),
        [
            'title' => 'Week 1 Quiz',
            'type' => 'assessment',
            'assessment_type' => 'quiz',
            'due_date' => now()->addDay()->toIsoString(),
            'allow_powerups' => true,
            'allowed_powerups' => [],
        ],
    );

    $response->assertRedirect(route('courses.manage.edit', $course));

    expect(Assessment::where('lesson_id', $lesson->id)->where('title', 'Week 1 Quiz')->exists())->toBeTrue();
    expect(CourseContent::where('lesson_id', $lesson->id)->where('title', 'Week 1 Quiz')->exists())->toBeFalse();
});

it('includes lessons and contents in manage edit payload', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create(['title' => 'Session 1']);
    CourseContent::query()->create([
        'lesson_id' => $lesson->id,
        'title' => 'Slides',
        'type' => 'file',
        'is_required' => true,
        'order' => 1,
    ]);
    CourseContent::query()->create([
        'lesson_id' => $lesson->id,
        'title' => 'Legacy Quiz',
        'type' => 'assessment',
        'is_required' => false,
        'order' => 2,
    ]);
    Assessment::factory()->for($course)->for($lesson)->create([
        'title' => 'Session Quiz',
        'type' => 'quiz',
    ]);

    $response = $this->actingAs($tutor)->get(route('courses.manage.edit', $course));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('courses/manage/edit')
        ->where('course.lessons.0.title', 'Session 1')
        ->where('course.lessons.0.contents.0.title', 'Slides')
        ->has('course.lessons.0.assessments', 1)
        ->where('course.lessons.0.assessments.0.title', 'Session Quiz')
        ->has('categories', 5)
    );
});

it('allows admins to view management and create courses', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($admin);

    get('/courses/manage')->assertSuccessful();

    $response = post('/courses/manage', [
        '_token' => csrf_token(),
        'title' => 'Admin Course',
        'description' => 'Admin created course',
        'difficulty' => 'beginner',
        'category' => CourseCategory::Physics->value,
        'is_published' => true,
        'instructor_id' => $tutor->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('courses', [
        'title' => 'Admin Course',
        'instructor_id' => $tutor->id,
    ]);
});

it('requires admins to assign a tutor when creating a course', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->post('/courses/manage', [
        '_token' => csrf_token(),
        'title' => 'Admin Course',
        'description' => 'Admin created course',
        'difficulty' => 'beginner',
        'category' => CourseCategory::Physics->value,
        'is_published' => true,
    ]);

    $response->assertSessionHasErrors('instructor_id');
});

it('rejects invalid course categories', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->post('/courses/manage', [
        '_token' => csrf_token(),
        'title' => 'Invalid Category',
        'description' => 'Invalid category course',
        'difficulty' => 'beginner',
        'category' => 'History',
        'is_published' => true,
    ]);

    $response->assertInvalid(['category']);
});

it('restricts students from course management', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $this->actingAs($student);

    get('/courses/manage')->assertForbidden();
    post('/courses/manage', [
        '_token' => csrf_token(),
        'title' => 'Should not work',
        'description' => 'Blocked',
    ])->assertForbidden();
});

it('allows tutors to manage only their courses', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $otherTutor = User::factory()->create();
    $otherTutor->assignRole('tutor');

    $ownCourse = Course::factory()->create(['instructor_id' => $tutor->id]);
    $otherCourse = Course::factory()->create(['instructor_id' => $otherTutor->id]);

    $this->actingAs($tutor);

    get('/courses/manage')->assertSuccessful();

    get("/courses/manage/{$otherCourse->id}/edit")->assertForbidden();

    post("/courses/manage/{$ownCourse->id}", [
        '_method' => 'put',
        '_token' => csrf_token(),
        'title' => 'Updated Title',
        'description' => $ownCourse->description,
        'difficulty' => 'intermediate',
        'category' => CourseCategory::Chemistry->value,
        'is_published' => true,
    ])->assertRedirect();

    $this->assertDatabaseHas('courses', [
        'id' => $ownCourse->id,
        'title' => 'Updated Title',
        'instructor_id' => $tutor->id,
    ]);
});
