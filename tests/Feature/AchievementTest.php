<?php

use App\Models\Achievement;
use App\Models\DailyTask;
use App\Models\User;
use App\Services\AchievementProgressService;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach (['admin', 'tutor', 'student'] as $role) {
        Role::firstOrCreate(['name' => $role]);
    }
});

test('achievement progress is tracked when completing tasks', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    // Create an achievement for completing tasks
    $achievement = Achievement::factory()->tasksCompleted(3)->create();

    // Create tasks
    $tasks = DailyTask::factory(3)->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    // Complete tasks one by one and check progress
    foreach ($tasks as $index => $task) {
        $this->actingAs($user)
            ->patch(route('tasks.toggle', $task), ['completed' => true]);

        $pivot = DB::table('achievement_user')
            ->where('achievement_id', $achievement->id)
            ->where('user_id', $user->id)
            ->first();

        expect($pivot)->not->toBeNull();
        expect($pivot->progress)->toBe($index + 1);
    }
});

test('achievement is awarded when target is reached', function () {
    $user = User::factory()->create(['total_xp' => 0]);
    $user->assignRole('student');

    // Create an achievement requiring 2 tasks
    $achievement = Achievement::factory()->tasksCompleted(2)->create([
        'xp_reward' => 100,
    ]);

    // Create and complete 2 tasks
    $task1 = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    $task2 = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    // Complete first task - should not award achievement yet
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task1), ['completed' => true]);

    $pivot = DB::table('achievement_user')
        ->where('achievement_id', $achievement->id)
        ->where('user_id', $user->id)
        ->first();

    expect($pivot->earned_at)->toBeNull();

    // Complete second task - should award achievement
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task2), ['completed' => true]);

    $pivot = DB::table('achievement_user')
        ->where('achievement_id', $achievement->id)
        ->where('user_id', $user->id)
        ->first();

    expect($pivot->earned_at)->not->toBeNull();
    expect($pivot->progress)->toBe(2);
});

test('achievement awards XP when earned', function () {
    $user = User::factory()->create(['total_xp' => 0]);
    $user->assignRole('student');

    // Create an achievement requiring 1 task with 100 XP reward
    $achievement = Achievement::factory()->tasksCompleted(1)->create([
        'xp_reward' => 100,
    ]);

    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    // Complete the task - should earn at least 10 XP from task + 100 XP from this achievement
    // May also earn additional XP from other achievements that get triggered
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), ['completed' => true]);

    $user->refresh();
    expect($user->total_xp)->toBeGreaterThanOrEqual(110);

    // Verify this specific achievement was awarded
    $pivot = DB::table('achievement_user')
        ->where('achievement_id', $achievement->id)
        ->where('user_id', $user->id)
        ->first();

    expect($pivot)->not->toBeNull();
    expect($pivot->earned_at)->not->toBeNull();
});

test('achievement creates activity when earned', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    $achievement = Achievement::factory()->tasksCompleted(1)->create();

    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), ['completed' => true]);

    $this->assertDatabaseHas('activities', [
        'user_id' => $user->id,
        'type' => 'achievement_earned',
    ]);
});

test('lessons completed achievement is tracked', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    $achievement = Achievement::factory()->lessonsCompleted(1)->create();

    // Create a lesson-type task
    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'type' => 'lesson',
        'xp_reward' => 10,
    ]);

    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), ['completed' => true]);

    $pivot = DB::table('achievement_user')
        ->where('achievement_id', $achievement->id)
        ->where('user_id', $user->id)
        ->first();

    expect($pivot)->not->toBeNull();
    expect($pivot->progress)->toBe(1);
    expect($pivot->earned_at)->not->toBeNull();
});

test('already earned achievements are not awarded again', function () {
    $user = User::factory()->create(['total_xp' => 0]);
    $user->assignRole('student');

    $achievement = Achievement::factory()->tasksCompleted(1)->create([
        'xp_reward' => 100,
    ]);

    // Pre-award the achievement
    DB::table('achievement_user')->insert([
        'achievement_id' => $achievement->id,
        'user_id' => $user->id,
        'progress' => 1,
        'earned_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 10,
    ]);

    // Complete task - should only get task XP, not achievement XP again
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), ['completed' => true]);

    $user->refresh();
    expect($user->total_xp)->toBe(10); // Only task XP, no achievement XP
});

test('achievements page displays achievements with progress', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    $achievement = Achievement::factory()->tasksCompleted(5)->create();

    // Add partial progress
    DB::table('achievement_user')->insert([
        'achievement_id' => $achievement->id,
        'user_id' => $user->id,
        'progress' => 2,
        'earned_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->get(route('achievements'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('achievements/index')
        ->has('achievements')
    );

    // Check the specific achievement has the correct progress
    $achievements = $response->original->getData()['page']['props']['achievements'];
    $found = collect($achievements)->firstWhere('id', $achievement->id);

    expect($found)->not->toBeNull();
    expect($found['progress'])->toBe(2);
    expect($found['target'])->toBe(5);
    expect($found['earned'])->toBeFalse();
});

test('achievements page shows earned achievements', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    $achievement = Achievement::factory()->tasksCompleted(1)->create();

    // Mark achievement as earned
    $user->achievements()->attach($achievement->id, [
        'earned_at' => now(),
        'progress' => 1,
    ]);

    $response = $this->actingAs($user)
        ->get(route('achievements'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('achievements/index')
        ->has('achievements')
    );

    // Check the specific achievement is marked as earned
    $achievements = $response->original->getData()['page']['props']['achievements'];
    $found = collect($achievements)->firstWhere('id', $achievement->id);

    expect($found)->not->toBeNull();
    expect($found['earned'])->toBeTrue();
});

test('dashboard shows recent achievements', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    $achievement = Achievement::factory()->tasksCompleted(1)->create();

    $user->achievements()->attach($achievement->id, [
        'earned_at' => now(),
        'progress' => 1,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('recent_achievements', 1)
        );
});

test('achievement summary shows correct counts', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    // Create achievements for this test
    $earned = Achievement::factory()->tasksCompleted(1)->create();

    // Earn one of them
    $user->achievements()->attach($earned->id, [
        'earned_at' => now(),
        'progress' => 1,
    ]);

    $this->actingAs($user)
        ->get(route('achievements'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('summary.total')
            ->has('summary.earned')
            ->where('summary.earned', 1)
        );
});

test('streak achievement progress is tracked via gamification service', function () {
    $user = User::factory()->create([
        'current_streak' => 0,
        'last_activity_date' => null,
    ]);
    $user->assignRole('student');

    $achievement = Achievement::factory()->streakDays(3)->create();

    $achievementService = app(AchievementProgressService::class);

    // Simulate 3 days of activity
    $user->current_streak = 3;
    $user->save();

    $achievementService->syncProgressFromData($user);

    $pivot = DB::table('achievement_user')
        ->where('achievement_id', $achievement->id)
        ->where('user_id', $user->id)
        ->first();

    expect($pivot)->not->toBeNull();
    expect($pivot->progress)->toBe(3);
    expect($pivot->earned_at)->not->toBeNull();
});
