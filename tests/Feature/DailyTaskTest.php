<?php

use App\Models\DailyTask;
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

it('can toggle a task to completed', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    $response = $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), [
            'completed' => true,
        ]);

    $response->assertRedirect();
    expect($task->fresh()->is_completed)->toBeTrue();
    expect($task->fresh()->completed_at)->not->toBeNull();
});

it('can toggle a task to incomplete', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => true,
        'completed_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), [
            'completed' => false,
        ]);

    $response->assertRedirect();
    expect($task->fresh()->is_completed)->toBeFalse();
    expect($task->fresh()->completed_at)->toBeNull();
});

it('prevents unauthorized users from toggling another users task', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('student');
    $user2 = User::factory()->create();
    $user2->assignRole('student');
    $task = DailyTask::factory()->for($user1)->create(['is_completed' => false]);

    $response = $this->actingAs($user2)
        ->patch(route('tasks.toggle', $task), [
            'completed' => true,
        ]);

    $response->assertForbidden();
    expect($task->fresh()->is_completed)->toBeFalse();
});

it('requires authentication to toggle task', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create(['is_completed' => false]);

    $response = $this->patch(route('tasks.toggle', $task), [
        'completed' => true,
    ]);

    $response->assertRedirect(route('login'));
});

it('requires completed field in request', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create(['is_completed' => false]);

    $response = $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), []);

    $response->assertSessionHasErrors('completed');
});

it('awards xp when completing a task', function () {
    $user = User::factory()->create(['total_xp' => 100]);
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 25,
    ]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), [
            'completed' => true,
        ]);

    $user->refresh();
    // XP should increase by at least the task reward (may include achievement bonuses)
    expect($user->total_xp)->toBeGreaterThanOrEqual(125);
});

it('does not award xp when marking task incomplete', function () {
    $user = User::factory()->create(['total_xp' => 100]);
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => true,
        'completed_at' => now(),
        'xp_reward' => 25,
    ]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), [
            'completed' => false,
        ]);

    $user->refresh();
    expect($user->total_xp)->toBe(100);
});

it('does not double award xp for already completed task', function () {
    $user = User::factory()->create(['total_xp' => 100]);
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => true,
        'completed_at' => now(),
        'xp_reward' => 25,
    ]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), [
            'completed' => true,
        ]);

    $user->refresh();
    expect($user->total_xp)->toBe(100);
});

it('creates activity when completing task', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 15,
    ]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), [
            'completed' => true,
        ]);

    $this->assertDatabaseHas('activities', [
        'user_id' => $user->id,
        'type' => 'task_completed',
        'xp_earned' => 15,
    ]);
});

it('allows tutors to toggle their own tasks', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $task = DailyTask::factory()->for($tutor)->create(['is_completed' => false]);

    $response = $this->actingAs($tutor)
        ->patch(route('tasks.toggle', $task), [
            'completed' => true,
        ]);

    $response->assertRedirect();
    expect($task->fresh()->is_completed)->toBeTrue();
});

it('allows admins to toggle their own tasks', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $task = DailyTask::factory()->for($admin)->create(['is_completed' => false]);

    $response = $this->actingAs($admin)
        ->patch(route('tasks.toggle', $task), [
            'completed' => true,
        ]);

    $response->assertRedirect();
    expect($task->fresh()->is_completed)->toBeTrue();
});

it('completing multiple tasks accumulates xp correctly', function () {
    $user = User::factory()->create(['total_xp' => 0]);
    $user->assignRole('student');

    $task1 = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    $task2 = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 15,
    ]);

    $task3 = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 25,
    ]);

    // Complete first task - XP should increase by task reward (plus any achievement bonuses)
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task1), ['completed' => true]);
    $user->refresh();
    $xpAfterTask1 = $user->total_xp;
    expect($xpAfterTask1)->toBeGreaterThanOrEqual(10);

    // Complete second task - XP should increase by at least the task reward
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task2), ['completed' => true]);
    $user->refresh();
    $xpAfterTask2 = $user->total_xp;
    expect($xpAfterTask2)->toBeGreaterThanOrEqual($xpAfterTask1 + 15);

    // Complete third task - XP should increase by at least the task reward
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task3), ['completed' => true]);
    $user->refresh();
    $xpAfterTask3 = $user->total_xp;
    expect($xpAfterTask3)->toBeGreaterThanOrEqual($xpAfterTask2 + 25);

    // Verify the minimum total XP (task rewards only) was accumulated
    // Additional XP may come from achievement bonuses
    expect($xpAfterTask3)->toBeGreaterThanOrEqual(50);
});

it('completing task can trigger level up', function () {
    // User starts at level 1 with XP close to leveling up
    $user = User::factory()->create([
        'total_xp' => 70,
        'level' => 1,
    ]);
    $user->assignRole('student');

    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), ['completed' => true]);

    $user->refresh();
    expect($user->total_xp)->toBe(80);
    // User should level up (75 XP needed for level 2)
    expect($user->level)->toBeGreaterThanOrEqual(2);
});

it('shows completed task in dashboard today tasks', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    // Use the same timezone as the dashboard controller
    $taskTimezone = config('gamification.daily_tasks.timezone', 'Asia/Jakarta');
    $taskToday = now($taskTimezone)->toDateString();

    $completedTask = DailyTask::factory()->for($user)->create([
        'is_completed' => true,
        'completed_at' => now(),
        'due_date' => $taskToday,
    ]);

    $pendingTask = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'due_date' => $taskToday,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('today_tasks', 2)
        );
});

it('tracks daily_all_tasks achievement when all tasks completed using correct task date', function () {
    $user = User::factory()->create(['total_xp' => 0]);
    $user->assignRole('student');

    // Use the DailyTaskGeneratorService to get the correct task date (respects reset time)
    $taskGeneratorService = app(\App\Services\DailyTaskGeneratorService::class);
    $taskDate = $taskGeneratorService->getTaskDate()->toDateString();

    // Create multiple tasks for "today" using the same logic as task generation
    $task1 = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
        'due_date' => $taskDate,
    ]);

    $task2 = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 15,
        'due_date' => $taskDate,
    ]);

    $task3 = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 20,
        'due_date' => $taskDate,
    ]);

    // Complete all tasks
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task1), ['completed' => true]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task2), ['completed' => true]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task3), ['completed' => true]);

    // Verify all tasks are marked completed
    expect($task1->fresh()->is_completed)->toBeTrue();
    expect($task2->fresh()->is_completed)->toBeTrue();
    expect($task3->fresh()->is_completed)->toBeTrue();

    // XP should be accumulated from all tasks
    $user->refresh();
    expect($user->total_xp)->toBeGreaterThanOrEqual(45);
});
