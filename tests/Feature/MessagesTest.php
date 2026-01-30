<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\TutorMessage;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
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

it('requires authentication', function () {
    $response = $this->get(route('messages'));
    $response->assertRedirect(route('login'));
});

it('renders messages index page for tutors', function () {
    $tutor = User::factory()->create()->assignRole('tutor');

    $response = $this->actingAs($tutor)->get(route('messages'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('messages/index')
        ->has('threads')
    );
});

it('lists message threads with unread count for a student', function () {
    $student = User::factory()->create()->assignRole('student');
    $tutor = User::factory()->create()->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    TutorMessage::factory()->create([
        'tutor_id' => $tutor->id,
        'user_id' => $student->id,
        'is_read' => false,
    ]);

    $response = $this->actingAs($student)->get(route('messages'));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('threads', 1)
    );
});

it('validates message body', function () {
    $student = User::factory()->create()->assignRole('student');
    $tutor = User::factory()->create()->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($student)
        ->post(route('messages.store'), [
            '_token' => csrf_token(),
            'partner_id' => $tutor->id,
            'content' => '',
        ]);

    $response->assertSessionHasErrors('content');
});

it('allows a tutor to message a student', function () {
    $tutor = User::factory()->create()->assignRole('tutor');
    $student = User::factory()->create()->assignRole('student');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($tutor)->post(route('messages.store'), [
        '_token' => csrf_token(),
        'partner_id' => $student->id,
        'content' => 'Hello student!',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('tutor_messages', [
        'tutor_id' => $tutor->id,
        'user_id' => $student->id,
        'content' => 'Hello student!',
        'is_read' => false,
    ]);
});

it('stores student to tutor messages with proper orientation', function () {
    $student = User::factory()->create()->assignRole('student');
    $tutor = User::factory()->create()->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($student)->post(route('messages.store'), [
        '_token' => csrf_token(),
        'partner_id' => $tutor->id,
        'content' => 'Hi tutor',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('tutor_messages', [
        'tutor_id' => $tutor->id,
        'user_id' => $student->id,
        'content' => 'Hi tutor',
    ]);
});

it('prevents admins from sending messages', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $student = User::factory()->create()->assignRole('student');

    $response = $this->actingAs($admin)->post(route('messages.store'), [
        '_token' => csrf_token(),
        'partner_id' => $student->id,
        'content' => 'Admin message should fail',
    ]);

    $response->assertForbidden();
});

it('allows admins to poll any tutor-student conversation', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $tutor = User::factory()->create()->assignRole('tutor');
    $student = User::factory()->create()->assignRole('student');

    TutorMessage::factory()->create([
        'tutor_id' => $tutor->id,
        'user_id' => $student->id,
        'content' => 'First message',
        'is_read' => false,
    ]);

    $response = $this->actingAs($admin)->getJson(route('messages.poll', [
        'tutor_id' => $tutor->id,
        'student_id' => $student->id,
    ]));

    $response->assertSuccessful();
    $response->assertJsonPath('activeThread.tutor.id', $tutor->id);
    $response->assertJsonPath('activeThread.student.id', $student->id);
    $response->assertJsonPath('activeThread.messages.data.0.content', 'First message');
});

it('marks messages as read when tutor views a conversation', function () {
    $tutor = User::factory()->create()->assignRole('tutor');
    $student = User::factory()->create()->assignRole('student');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $message = TutorMessage::factory()->create([
        'tutor_id' => $tutor->id,
        'user_id' => $student->id,
        'content' => 'Unread message',
        'is_read' => false,
    ]);

    $this->actingAs($tutor)->get(route('messages', [
        'partner' => $student->id,
    ]))->assertSuccessful();

    expect($message->fresh()->is_read)->toBeTrue();
});

it('blocks student from messaging a tutor without enrollment', function () {
    $student = User::factory()->create()->assignRole('student');
    $tutor = User::factory()->create()->assignRole('tutor');

    $response = $this->actingAs($student)->post(route('messages.store'), [
        '_token' => csrf_token(),
        'partner_id' => $tutor->id,
        'content' => 'Hello',
    ]);

    $response->assertForbidden();
});

it('blocks tutor from messaging a student without enrollment', function () {
    $student = User::factory()->create()->assignRole('student');
    $tutor = User::factory()->create()->assignRole('tutor');

    $response = $this->actingAs($tutor)->post(route('messages.store'), [
        '_token' => csrf_token(),
        'partner_id' => $student->id,
        'content' => 'Hello',
    ]);

    $response->assertForbidden();
});

it('shows contacts for instructors without tutor role', function () {
    $instructor = User::factory()->create(); // no tutor role
    $student = User::factory()->create()->assignRole('student');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($instructor)->get(route('messages'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('contacts.0.id', $student->id)
        ->where('contacts.0.role', 'student')
    );
});

it('allows student to message course instructor without tutor role', function () {
    $student = User::factory()->create()->assignRole('student');
    $instructor = User::factory()->create(); // no tutor role
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($student)->post(route('messages.store'), [
        '_token' => csrf_token(),
        'partner_id' => $instructor->id,
        'content' => 'Hi instructor',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tutor_messages', [
        'tutor_id' => $instructor->id,
        'user_id' => $student->id,
        'content' => 'Hi instructor',
    ]);
});

it('allows course instructor without tutor role to message student', function () {
    $student = User::factory()->create()->assignRole('student');
    $instructor = User::factory()->create(); // no tutor role
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($instructor)->post(route('messages.store'), [
        '_token' => csrf_token(),
        'partner_id' => $student->id,
        'content' => 'Hello student',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tutor_messages', [
        'tutor_id' => $instructor->id,
        'user_id' => $student->id,
        'content' => 'Hello student',
    ]);
});

it('exposes contacts for students based on enrollments', function () {
    $student = User::factory()->create()->assignRole('student');
    $tutor = User::factory()->create()->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($student)->get(route('messages'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('contacts.0.id', $tutor->id)
        ->where('contacts.0.role', 'tutor')
    );
});
