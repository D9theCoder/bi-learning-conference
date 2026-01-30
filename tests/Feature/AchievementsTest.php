<?php

use App\Models\Achievement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach (['admin', 'tutor', 'student'] as $role) {
        Role::firstOrCreate(['name' => $role]);
    }
});

it('requires authentication', function () {
    $response = $this->get(route('achievements'));
    $response->assertRedirect(route('login'));
});

it('renders achievements index page', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    Achievement::factory()->count(5)->create();

    $response = $this->actingAs($user)->get(route('achievements'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('achievements/index')
        ->has('achievements', 5)
        ->has('summary')
    );
});

it('shows earned achievements with earned_at date', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $achievement = Achievement::factory()->create();
    $user->achievements()->attach($achievement->id, ['earned_at' => now()]);

    $response = $this->actingAs($user)->get(route('achievements'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('achievements.0.earned', true)
        ->has('achievements.0.earned_at')
    );
});

it('shows summary statistics', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    Achievement::factory()->count(10)->create();
    $earned = Achievement::factory()->create();
    $user->achievements()->attach($earned->id, ['earned_at' => now()]);

    $response = $this->actingAs($user)->get(route('achievements'));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('summary.total', 11)
        ->where('summary.earned', 1)
    );
});

it('allows admins to view achievements', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Achievement::factory()->count(2)->create();

    $response = $this->actingAs($admin)->get(route('achievements'));

    $response->assertSuccessful();
});

it('prevents tutors from viewing achievements', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($tutor)->get(route('achievements'))->assertForbidden();
});
