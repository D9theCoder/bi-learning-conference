<?php

use App\Models\Assessment;
use App\Models\Course;
use App\Models\DailyTask;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\StudentMeetingSchedule;
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
    $response = $this->get(route('calendar'));
    $response->assertRedirect(route('login'));
});

it('renders calendar index page', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    DailyTask::factory()->for($user)->create(['due_date' => today()]);

    $response = $this->actingAs($user)->get(route('calendar'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('calendar/index')
        ->has('tasksByDate')
        ->has('stats')
    );
});

it('groups tasks by date', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    DailyTask::factory()->for($user)->count(3)->create(['due_date' => today()]);
    DailyTask::factory()->for($user)->count(2)->create(['due_date' => today()->addDay()]);

    $response = $this->actingAs($user)->get(route('calendar'));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('tasksByDate.'.today()->format('Y-m-d'), 3)
        ->has('tasksByDate.'.today()->addDay()->format('Y-m-d'), 2)
    );
});

it('includes course metadata for meetings and assessments', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $meetingDate = now()->addDay();
    $assessmentDate = now()->addDays(2);

    $lesson = Lesson::factory()->create([
        'course_id' => $course->id,
    ]);

    $schedule = StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'student_id' => $user->id,
        'scheduled_at' => $meetingDate,
        'meeting_url' => 'https://example.com/meet',
        'status' => 'scheduled',
    ]);

    Assessment::factory()->published()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'due_date' => $assessmentDate,
    ]);

    $response = $this->actingAs($user)->get(route('calendar'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('tasksByDate.'.$meetingDate->format('Y-m-d').'.0.course_id', $course->id)
        ->where('tasksByDate.'.$meetingDate->format('Y-m-d').'.0.lesson_id', $lesson->id)
        ->where('tasksByDate.'.$meetingDate->format('Y-m-d').'.0.meeting_url', $schedule->meeting_url)
        ->where('tasksByDate.'.$assessmentDate->format('Y-m-d').'.0.course_id', $course->id)
        ->where('tasksByDate.'.$assessmentDate->format('Y-m-d').'.0.lesson_id', $lesson->id)
    );
});

it('toggles task completion', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create(['is_completed' => false]);

    $response = $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), [
            '_token' => csrf_token(),
            'completed' => true,
        ]);

    $response->assertRedirect();
    expect($task->fresh()->is_completed)->toBeTrue();
});

it('prevents unauthorized task toggle', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('student');
    $user2 = User::factory()->create();
    $user2->assignRole('student');
    $task = DailyTask::factory()->for($user1)->create();

    $response = $this->actingAs($user2)
        ->patch(route('tasks.toggle', $task), [
            '_token' => csrf_token(),
            'completed' => true,
        ]);

    $response->assertForbidden();
});

it('allows tutors to view calendar', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $response = $this->actingAs($tutor)->get(route('calendar'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('calendar/index')
    );
});

it('shows all courses to admin users', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $instructor = User::factory()->create(['name' => 'Ada Lovelace']);
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);
    $otherCourse = Course::factory()->create();

    $response = $this->actingAs($admin)->get(route('calendar'));

    $response->assertSuccessful();
    $courses = $response->inertiaProps('courses.data');

    expect($courses)->toHaveCount(2);
    expect(collect($courses)->pluck('id'))->toContain($course->id, $otherCourse->id);

    $courseSnapshot = collect($courses)->firstWhere('id', $course->id);
    expect($courseSnapshot['instructor']['name'])->toBe('Ada Lovelace');
});

it('paginates admin course list', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    Course::factory()->count(13)->create();

    $response = $this->actingAs($admin)->get(route('calendar'));

    $courses = $response->inertiaProps('courses');

    expect($courses['data'])->toHaveCount(12);
    expect($courses['total'])->toBe(13);
    expect($courses['last_page'])->toBe(2);
});

it('includes course markers in admin calendar', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $course = Course::factory()->create();

    $meetingDate = now()->addDay();
    $assessmentDate = now()->addDays(2);

    $lesson = Lesson::factory()->create([
        'course_id' => $course->id,
    ]);

    StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'student_id' => User::factory(),
        'scheduled_at' => $meetingDate,
        'status' => 'scheduled',
    ]);

    Assessment::factory()->published()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'due_date' => $assessmentDate,
    ]);

    $response = $this->actingAs($admin)->get(route('calendar'));

    $courseMarkers = $response->inertiaProps('courseMarkers');

    expect($courseMarkers)->toContain($meetingDate->toDateString());
    expect($courseMarkers)->toContain($assessmentDate->toDateString());
});
