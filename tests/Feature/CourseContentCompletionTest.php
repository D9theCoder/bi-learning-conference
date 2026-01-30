<?php

use App\Models\Course;
use App\Models\CourseContent;
use App\Models\CourseContentCompletion;
use App\Models\DailyTask;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use App\Services\DailyTaskGeneratorService;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
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

it('allows enrolled students to mark content as complete', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();
    $content = CourseContent::factory()->for($lesson)->create(['type' => 'link', 'url' => 'https://example.com']);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($student)
        ->postJson(route('contents.complete', $content));

    $response->assertSuccessful();
    $response->assertJson(['success' => true, 'was_new' => true]);

    $this->assertDatabaseHas('course_content_completions', [
        'user_id' => $student->id,
        'course_content_id' => $content->id,
    ]);
});

it('prevents non-enrolled users from marking content complete', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();
    $content = CourseContent::factory()->for($lesson)->create();

    $response = $this->actingAs($student)
        ->postJson(route('contents.complete', $content));

    $response->assertForbidden();
});

it('automatically completes daily task when all lesson content is completed', function () {
    $student = User::factory()->create(['total_xp' => 0]);
    $student->assignRole('student');

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();

    // Create one content item for the lesson
    $content = CourseContent::factory()->for($lesson)->create([
        'type' => 'link',
        'url' => 'https://example.com',
        'is_required' => false,
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    // Create a daily task for this lesson
    $taskDate = app(DailyTaskGeneratorService::class)->getTaskDate()->toDateString();
    $dailyTask = DailyTask::factory()->create([
        'user_id' => $student->id,
        'lesson_id' => $lesson->id,
        'type' => 'lesson',
        'is_completed' => false,
        'xp_reward' => 25,
        'due_date' => $taskDate,
    ]);

    // Mark the content as complete
    $response = $this->actingAs($student)
        ->postJson(route('contents.complete', $content));

    $response->assertSuccessful();

    // Daily task should now be completed
    $dailyTask->refresh();
    expect($dailyTask->is_completed)->toBeTrue();
    expect($dailyTask->completed_at)->not->toBeNull();

    // XP should be awarded
    $student->refresh();
    expect($student->total_xp)->toBeGreaterThanOrEqual(25);
});

it('does not double complete content', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();
    $content = CourseContent::factory()->for($lesson)->create(['type' => 'link', 'url' => 'https://example.com']);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    // First completion
    $response1 = $this->actingAs($student)
        ->postJson(route('contents.complete', $content));
    $response1->assertJson(['was_new' => true]);

    // Second completion (should not be "new")
    $response2 = $this->actingAs($student)
        ->postJson(route('contents.complete', $content));
    $response2->assertJson(['was_new' => false]);

    // Should still only have one completion record
    expect(CourseContentCompletion::where('user_id', $student->id)->count())->toBe(1);
});

it('only completes daily task when all required content is done', function () {
    $student = User::factory()->create(['total_xp' => 0]);
    $student->assignRole('student');

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();

    // Create two required content items
    $content1 = CourseContent::factory()->for($lesson)->create([
        'type' => 'link',
        'url' => 'https://example1.com',
        'is_required' => true,
        'order' => 1,
    ]);
    $content2 = CourseContent::factory()->for($lesson)->create([
        'type' => 'link',
        'url' => 'https://example2.com',
        'is_required' => true,
        'order' => 2,
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $taskDate = app(DailyTaskGeneratorService::class)->getTaskDate()->toDateString();
    $dailyTask = DailyTask::factory()->create([
        'user_id' => $student->id,
        'lesson_id' => $lesson->id,
        'type' => 'lesson',
        'is_completed' => false,
        'xp_reward' => 25,
        'due_date' => $taskDate,
    ]);

    // Complete first content - task should NOT be completed yet
    $this->actingAs($student)->postJson(route('contents.complete', $content1));
    $dailyTask->refresh();
    expect($dailyTask->is_completed)->toBeFalse();

    // Complete second content - task should now be completed
    $this->actingAs($student)->postJson(route('contents.complete', $content2));
    $dailyTask->refresh();
    expect($dailyTask->is_completed)->toBeTrue();
});

it('allows admins to mark content complete without enrollment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();
    $content = CourseContent::factory()->for($lesson)->create();

    $response = $this->actingAs($admin)
        ->postJson(route('contents.complete', $content));

    $response->assertSuccessful();
});

it('allows tutors to mark content complete without enrollment', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();
    $content = CourseContent::factory()->for($lesson)->create();

    $response = $this->actingAs($tutor)
        ->postJson(route('contents.complete', $content));

    $response->assertSuccessful();
});
