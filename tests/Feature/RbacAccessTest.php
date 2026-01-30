<?php

use App\Models\Course;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('allows students to access student areas', function () {
    $student = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $student->assignRole('student');

    $this->actingAs($student);

    $this->get(route('dashboard'))->assertSuccessful();
    $this->get(route('achievements'))->assertSuccessful();
    $this->get(route('rewards'))->assertSuccessful();
});

it('allows tutors on shared surfaces while blocking student-only actions', function () {
    $tutor = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $tutor->assignRole('tutor');

    $course = Course::factory()->create();

    $this->actingAs($tutor);

    $this->get(route('dashboard'))->assertSuccessful();
    $this->get(route('calendar'))->assertSuccessful();
    $this->get(route('rewards'))->assertForbidden();
    $this->post(route('courses.enroll', $course), [
        '_token' => csrf_token(),
    ])->assertForbidden();
});

it('allows admins to bypass role restrictions', function () {
    $admin = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $admin->assignRole('admin');

    $course = Course::factory()->create();

    $this->actingAs($admin);

    $this->get(route('dashboard'))->assertSuccessful();
    $this->get(route('rewards'))->assertSuccessful();
    $this->post(route('courses.enroll', $course), [
        '_token' => csrf_token(),
    ])->assertRedirect(route('courses'));
});
