<?php

use App\CourseCategory;
use App\Models\Course;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('denies tutor access to create course page', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($tutor)
        ->get('/courses/manage/create')
        ->assertForbidden();
});

it('denies tutor from storing new course', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($tutor)
        ->post('/courses/manage', [
            '_token' => csrf_token(),
            'title' => 'New Course',
            'description' => 'Test description',
        ])
        ->assertForbidden();
});

it('allows admin to create course with tutor assignment', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($admin)
        ->post('/courses/manage', [
            '_token' => csrf_token(),
            'title' => 'New Course',
            'description' => 'Test description',
            'category' => CourseCategory::Physics->value,
            'instructor_id' => $tutor->id,
        ])
        ->assertRedirect();

    expect(Course::where('title', 'New Course')->exists())->toBeTrue();
});

it('allows tutor to edit assigned course', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    $this->actingAs($tutor)
        ->get("/courses/manage/{$course->id}/edit")
        ->assertSuccessful();
});

it('denies tutor from editing unassigned course', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $otherTutor = User::factory()->create();
    $otherTutor->assignRole('tutor');

    $course = Course::factory()->create(['instructor_id' => $otherTutor->id]);

    $this->actingAs($tutor)
        ->get("/courses/manage/{$course->id}/edit")
        ->assertForbidden();
});
