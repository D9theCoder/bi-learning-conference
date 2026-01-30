<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\StudentMeetingSchedule;
use App\Models\User;
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

it('allows tutors to list all student schedules for their course', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    $studentOne = User::factory()->create();
    $studentOne->assignRole('student');
    $studentTwo = User::factory()->create();
    $studentTwo->assignRole('student');

    Enrollment::factory()->for($studentOne)->for($course)->create();
    Enrollment::factory()->for($studentTwo)->for($course)->create();

    $scheduleOne = StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'student_id' => $studentOne->id,
        'scheduled_at' => now()->addDay(),
    ]);
    $scheduleTwo = StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'student_id' => $studentTwo->id,
        'scheduled_at' => now()->addDays(2),
    ]);

    $response = $this->actingAs($tutor)->get(route('courses.schedules.index', $course));

    $response
        ->assertSuccessful()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment(['id' => $scheduleOne->id])
        ->assertJsonFragment(['id' => $scheduleTwo->id]);
});

it('allows tutors to create a meeting for an enrolled student', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $student = User::factory()->create();
    $student->assignRole('student');
    $lesson = Lesson::factory()->for($course)->create();

    Enrollment::factory()->for($student)->for($course)->create();

    $response = $this->actingAs($tutor)->post(route('courses.schedules.store', $course), [
        'student_id' => $student->id,
        'lesson_id' => $lesson->id,
        'title' => 'Kickoff Meeting',
        'scheduled_at' => now()->addDay()->toDateTimeString(),
        'duration_minutes' => 45,
        'meeting_url' => 'https://meet.example.com/room',
        'notes' => 'Bring the course outline.',
        'status' => 'scheduled',
    ]);

    $response->assertRedirect();

    expect(StudentMeetingSchedule::query()
        ->where('course_id', $course->id)
        ->where('student_id', $student->id)
        ->where('title', 'Kickoff Meeting')
        ->exists())->toBeTrue();
});

it('prevents tutors from scheduling meetings for non-enrolled students', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $student = User::factory()->create();
    $student->assignRole('student');
    $lesson = Lesson::factory()->for($course)->create();

    $response = $this->actingAs($tutor)->post(route('courses.schedules.store', $course), [
        'student_id' => $student->id,
        'lesson_id' => $lesson->id,
        'title' => 'Not Allowed',
        'scheduled_at' => now()->addDay()->toDateTimeString(),
        'duration_minutes' => 30,
    ]);

    $response->assertSessionHasErrors('student_id');
});

it('allows tutors to update and delete meetings', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $student = User::factory()->create();
    $student->assignRole('student');
    $lesson = Lesson::factory()->for($course)->create();

    Enrollment::factory()->for($student)->for($course)->create();

    $schedule = StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'student_id' => $student->id,
        'scheduled_at' => now()->addDay(),
    ]);

    $updateResponse = $this->actingAs($tutor)->put(
        route('courses.schedules.update', [$course, $schedule]),
        [
            'lesson_id' => $lesson->id,
            'title' => 'Updated Title',
            'scheduled_at' => now()->addDays(3)->toDateTimeString(),
            'status' => 'completed',
        ]
    );

    $updateResponse->assertRedirect();

    $schedule->refresh();
    expect($schedule->title)->toBe('Updated Title');
    expect($schedule->status)->toBe('completed');

    $deleteResponse = $this->actingAs($tutor)->delete(
        route('courses.schedules.destroy', [$course, $schedule])
    );

    $deleteResponse->assertRedirect();
    expect(StudentMeetingSchedule::where('id', $schedule->id)->exists())->toBeFalse();
});

it('allows students to see only their own schedules', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    $studentOne = User::factory()->create();
    $studentOne->assignRole('student');
    $studentTwo = User::factory()->create();
    $studentTwo->assignRole('student');

    Enrollment::factory()->for($studentOne)->for($course)->create();
    Enrollment::factory()->for($studentTwo)->for($course)->create();

    $scheduleOne = StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'student_id' => $studentOne->id,
        'scheduled_at' => now()->addDay(),
    ]);
    StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'student_id' => $studentTwo->id,
        'scheduled_at' => now()->addDays(2),
    ]);

    $response = $this->actingAs($studentOne)->get(route('courses.schedules.index', $course));

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['id' => $scheduleOne->id]);
});

it('prevents students from creating, updating, or deleting schedules', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $student = User::factory()->create();
    $student->assignRole('student');
    $lesson = Lesson::factory()->for($course)->create();

    Enrollment::factory()->for($student)->for($course)->create();

    $schedule = StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'student_id' => $student->id,
        'scheduled_at' => now()->addDay(),
    ]);

    $this->actingAs($student)
        ->post(route('courses.schedules.store', $course), [
            'student_id' => $student->id,
            'lesson_id' => $lesson->id,
            'title' => 'Nope',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
        ])
        ->assertForbidden();

    $this->actingAs($student)
        ->put(route('courses.schedules.update', [$course, $schedule]), [
            'lesson_id' => $lesson->id,
            'title' => 'Nope',
            'scheduled_at' => now()->addDays(2)->toDateTimeString(),
        ])
        ->assertForbidden();

    $this->actingAs($student)
        ->delete(route('courses.schedules.destroy', [$course, $schedule]))
        ->assertForbidden();
});

it('prevents non-enrolled students from viewing schedules', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    $student = User::factory()->create();
    $student->assignRole('student');

    $this->actingAs($student)
        ->get(route('courses.schedules.index', $course))
        ->assertForbidden();
});
