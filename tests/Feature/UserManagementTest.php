<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('allows admin to view user management page', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get('/admin/users')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
        );
});

it('denies tutor access to user management page', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($tutor)
        ->get('/admin/users')
        ->assertForbidden();
});

it('denies student access to user management page', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $this->actingAs($student)
        ->get('/admin/users')
        ->assertForbidden();
});

it('allows admin to create a student', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post('/admin/users', [
            '_token' => csrf_token(),
            'name' => 'New Student',
            'email' => 'student@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'student',
        ])
        ->assertRedirect(route('admin.users.index'));

    $newStudent = User::where('email', 'student@example.com')->first();
    expect($newStudent)->not->toBeNull();
    expect($newStudent->hasRole('student'))->toBeTrue();
});

it('allows admin to create a tutor', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post('/admin/users', [
            '_token' => csrf_token(),
            'name' => 'New Tutor',
            'email' => 'tutor@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'tutor',
        ])
        ->assertRedirect(route('admin.users.index'));

    $newTutor = User::where('email', 'tutor@example.com')->first();
    expect($newTutor)->not->toBeNull();
    expect($newTutor->hasRole('tutor'))->toBeTrue();
});

it('allows admin to soft delete a user', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $user = User::factory()->create();
    $user->assignRole('student');

    $this->actingAs($admin)
        ->delete("/admin/users/{$user->id}", [
            '_token' => csrf_token(),
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->assertSoftDeleted('users', [
        'id' => $user->id,
    ]);
});

it('allows admin to edit user details and role', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $user = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
    ]);
    $user->assignRole('student');

    $this->actingAs($admin)
        ->get("/admin/users/{$user->id}/edit")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/edit')
            ->where('user.id', $user->id)
        );

    $this->actingAs($admin)
        ->put("/admin/users/{$user->id}", [
            '_token' => csrf_token(),
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'role' => 'tutor',
        ])
        ->assertRedirect(route('admin.users.index'));

    $user->refresh();

    expect($user->name)->toBe('Updated Name');
    expect($user->email)->toBe('updated@example.com');
    expect($user->hasRole('tutor'))->toBeTrue();
});

it('prevents admins from deleting their own account', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->delete("/admin/users/{$admin->id}", [
            '_token' => csrf_token(),
        ])
        ->assertSessionHasErrors('user');
});
