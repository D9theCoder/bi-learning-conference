<?php

use App\Models\DailyTask;
use App\Models\User;
use App\Services\DailyTaskGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
  $this->withoutMiddleware([
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
  ]);

  app(PermissionRegistrar::class)->forgetCachedPermissions();

  foreach (['admin', 'tutor', 'student'] as $role) {
    Role::firstOrCreate(['name' => $role]);
  }
});

it('can generate tasks when none exist', function () {
  $user = User::factory()->create();
  $user->assignRole('student');

  $response = $this->actingAs($user)
    ->post(route('tasks.generate'));

  $response->assertRedirect();
  $response->assertSessionHas('success');

  $taskDate = app(DailyTaskGeneratorService::class)->getTaskDate()->toDateString();
  expect(DailyTask::where('user_id', $user->id)->whereDate('due_date', $taskDate)->count())->toBeGreaterThan(0);
});

it('does not generate tasks when some already exist via generate endpoint', function () {
  $user = User::factory()->create();
  $user->assignRole('student');

  $taskDate = app(DailyTaskGeneratorService::class)->getTaskDate()->toDateString();
  DailyTask::factory()->for($user)->create(['due_date' => $taskDate]);

  $response = $this->actingAs($user)
    ->post(route('tasks.generate'));

  $response->assertRedirect();
  $response->assertSessionHas('info', 'Tasks already exist for today or no courses enrolled.');
  expect(DailyTask::where('user_id', $user->id)->whereDate('due_date', $taskDate)->count())->toBe(1);
});

it('can force regenerate tasks even when completed tasks exist', function () {
  $user = User::factory()->create();
  $user->assignRole('student');

  $taskDate = app(DailyTaskGeneratorService::class)->getTaskDate()->toDateString();

  // Create one completed task and one incomplete task
  $completedTask = DailyTask::factory()->for($user)->create([
    'due_date' => $taskDate,
    'is_completed' => true
  ]);

  $incompleteTask = DailyTask::factory()->for($user)->create([
    'due_date' => $taskDate,
    'is_completed' => false
  ]);

  expect(DailyTask::where('user_id', $user->id)->whereDate('due_date', $taskDate)->count())->toBe(2);

  $response = $this->actingAs($user)
    ->post(route('tasks.force-generate'));

  $response->assertRedirect();
  $response->assertSessionHas('success');

  // Both old tasks should be gone
  $this->assertDatabaseMissing('daily_tasks', ['id' => $completedTask->id]);
  $this->assertDatabaseMissing('daily_tasks', ['id' => $incompleteTask->id]);

  // New tasks should be generated
  $newTasksCount = DailyTask::where('user_id', $user->id)->whereDate('due_date', $taskDate)->count();
  expect($newTasksCount)->toBeGreaterThan(0);

  // New tasks should be incomplete
  expect(DailyTask::where('user_id', $user->id)->whereDate('due_date', $taskDate)->where('is_completed', true)->count())->toBe(0);
});
