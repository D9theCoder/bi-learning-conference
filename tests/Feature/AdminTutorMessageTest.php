<?php

use App\Models\Course;
use App\Models\TutorMessage;
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

it('allows admins to view admin-tutor messages', function () {
    $admin = User::factory()->create()->assignRole('admin');

    $response = $this->actingAs($admin)->get(route('admin-messages'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin-messages/index')
        ->has('threads')
        ->has('tutors')
    );
});

it('shows tutors for admins to start conversations', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $tutor = User::factory()->create(['name' => 'Alpha Tutor'])->assignRole('tutor');
    $instructor = User::factory()->create(['name' => 'Beta Tutor']);

    Course::factory()->create(['instructor_id' => $instructor->id]);

    $response = $this->actingAs($admin)->get(route('admin-messages'));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('tutors', 2)
        ->where('tutors.0.id', $tutor->id)
        ->where('tutors.1.id', $instructor->id)
    );
});

it('allows admins to start a conversation with a tutor', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $tutor = User::factory()->create()->assignRole('tutor');

    $response = $this->actingAs($admin)->post(route('admin-messages.store'), [
        '_token' => csrf_token(),
        'tutor_id' => $tutor->id,
        'content' => 'Welcome to the admin channel.',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('tutor_messages', [
        'tutor_id' => $tutor->id,
        'user_id' => $admin->id,
        'content' => 'Welcome to the admin channel.',
    ]);
});

it('shows tutors their admin conversations without tutor lists', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $tutor = User::factory()->create()->assignRole('tutor');

    TutorMessage::factory()->create([
        'tutor_id' => $tutor->id,
        'user_id' => $admin->id,
        'sender_id' => $admin->id,
        'content' => 'Hello tutor!',
    ]);

    $response = $this->actingAs($tutor)->get(route('admin-messages'));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('threads', 1)
        ->where('threads.0.admin.id', $admin->id)
        ->has('tutors', 0)
    );
});

it('allows tutors to reply once an admin starts a conversation', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $tutor = User::factory()->create()->assignRole('tutor');

    TutorMessage::factory()->create([
        'tutor_id' => $tutor->id,
        'user_id' => $admin->id,
        'sender_id' => $admin->id,
        'content' => 'Initial message.',
    ]);

    $response = $this->actingAs($tutor)->post(route('admin-messages.store'), [
        '_token' => csrf_token(),
        'admin_id' => $admin->id,
        'content' => 'Reply from tutor.',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('tutor_messages', [
        'tutor_id' => $tutor->id,
        'user_id' => $admin->id,
        'content' => 'Reply from tutor.',
    ]);
});

it('prevents tutors from initiating admin conversations', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $tutor = User::factory()->create()->assignRole('tutor');

    $response = $this->actingAs($tutor)->post(route('admin-messages.store'), [
        '_token' => csrf_token(),
        'admin_id' => $admin->id,
        'content' => 'Tutor should not initiate.',
    ]);

    $response->assertForbidden();
});

it('prevents students from accessing admin-tutor messages', function () {
    $student = User::factory()->create()->assignRole('student');

    $response = $this->actingAs($student)->get(route('admin-messages'));

    $response->assertForbidden();
});
