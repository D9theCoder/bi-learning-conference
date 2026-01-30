<?php

use App\Models\Achievement;
use App\Models\Assessment;
use App\Models\Course;
use App\Models\DailyTask;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\StudentMeetingSchedule;
use App\Models\User;
use App\Services\DailyTaskGeneratorService;
use Inertia\Testing\AssertableInertia as Assert;
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

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('dashboard')
                ->has('stats')
                ->has('today_tasks')
                ->has('enrolled_courses')
                ->has('weekly_activity_data')
        );
});

test('tutors can visit the dashboard', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($tutor)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('dashboard')
        );
});

test('admins receive monitoring data and no gamification stats', function () {
    $admin = User::factory()->create([
        'total_xp' => 1200,
        'level' => 4,
        'points_balance' => 300,
    ]);
    $admin->assignRole('admin');

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $student = User::factory()->create();
    $student->assignRole('student');

    $course = Course::factory()->create([
        'instructor_id' => $tutor->id,
        'is_published' => true,
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('dashboard')
                ->has('admin_dashboard.tutors')
                ->has('admin_dashboard.courses')
                ->has('admin_dashboard.students')
                ->where(
                    'admin_dashboard.tutors',
                    fn ($tutors) => collect($tutors)->pluck('id')->contains($tutor->id)
                )
                ->where(
                    'admin_dashboard.courses',
                    fn ($courses) => collect($courses)->pluck('id')->contains($course->id)
                )
                ->where(
                    'admin_dashboard.summary.tutor_count',
                    fn ($count) => $count >= 1
                )
                ->where(
                    'admin_dashboard.summary.course_count',
                    fn ($count) => $count >= 1
                )
                ->where(
                    'admin_dashboard.summary.student_count',
                    fn ($count) => $count >= 1
                )
                ->where(
                    'admin_dashboard.summary.active_enrollment_count',
                    fn ($count) => $count >= 1
                )
                ->where('stats.total_xp', 0)
                ->where('stats.level', 1)
                ->where('stats.points_balance', 0)
        );
});

test('dashboard displays user statistics', function () {
    $user = User::factory()->create([
        'total_xp' => 2500,
        'level' => 8,
        'points_balance' => 850,
        'current_streak' => 5,
    ]);
    $user->assignRole('student');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('stats.streak', 5)
                ->where('stats.level', 8)
                ->where('stats.points_balance', 850)
                ->has('stats.xp_in_level')
                ->has('stats.xp_for_next_level')
                ->has('stats.level_progress_percentage')
        );
});

test('dashboard shows enrolled courses', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $course = Course::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
        'progress_percentage' => 45,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('enrolled_courses', 1)
                ->where('enrolled_courses.0.progress_percentage', 45)
        );
});

test('dashboard student calendar exposes course metadata', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    $course = Course::factory()->create();
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $lesson = Lesson::factory()->create([
        'course_id' => $course->id,
    ]);

    $schedule = StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'student_id' => $user->id,
        'scheduled_at' => now()->addDay(),
        'meeting_url' => 'https://example.com/session',
        'status' => 'scheduled',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('student_calendar.0.course_id', $course->id)
                ->where('student_calendar.0.lesson_id', $lesson->id)
                ->where('student_calendar.0.meeting_url', $schedule->meeting_url)
        );
});

test('dashboard displays today tasks', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    // Use the same timezone as the dashboard controller
    $taskToday = app(DailyTaskGeneratorService::class)->getTaskDate()->toDateString();

    DailyTask::factory()->create([
        'user_id' => $user->id,
        'due_date' => $taskToday,
        'is_completed' => false,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('today_tasks', 1)
        );
});

test('dashboard shows global leaderboard', function () {
    $user = User::factory()->create([
        'total_xp' => 1000,
    ]);
    $user->assignRole('student');

    User::factory(5)->create([
        'total_xp' => fake()->numberBetween(500, 2000),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('global_leaderboard')
                ->has('current_user_rank')
        );
});

test('dashboard shows recent achievements', function () {
    $user = User::factory()->create();
    $user->assignRole('student');
    $achievement = Achievement::factory()->create();
    $user->achievements()->attach($achievement->id, ['earned_at' => now()]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('recent_achievements', 1)
        );
});

test('tutor dashboard includes tutor data and chart metrics', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $student = User::factory()->create();
    $student->assignRole('student');

    $course = Course::factory()->create([
        'instructor_id' => $tutor->id,
    ]);

    $lesson = Lesson::factory()->create([
        'course_id' => $course->id,
        'order' => 1,
    ]);

    // Create assessments with future due dates for the calendar
    Assessment::factory()->published()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'type' => 'quiz',
        'due_date' => now()->addDays(2),
    ]);

    Assessment::factory()->published()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'type' => 'assignment',
        'due_date' => now()->addDays(3),
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
        'progress_percentage' => 60,
    ]);

    $schedule = StudentMeetingSchedule::factory()->create([
        'course_id' => $course->id,
        'lesson_id' => $lesson->id,
        'student_id' => $student->id,
        'scheduled_at' => now()->addDay(),
        'meeting_url' => 'https://example.com/meet',
        'status' => 'scheduled',
    ]);

    $this->actingAs($tutor)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('tutor_dashboard')
                ->where('tutor_dashboard.summary.course_count', 1)
                ->has('tutor_dashboard.chart', 1)
                ->has('tutor_dashboard.calendar', 3)
                ->has('tutor_dashboard.courses', 1)
                ->where('tutor_dashboard.calendar.0.lesson_id', $lesson->id)
                ->where('tutor_dashboard.calendar.0.course_id', $course->id)
                ->where('tutor_dashboard.calendar.0.meeting_url', $schedule->meeting_url)
        );
});

test('leaderboard is sorted by XP descending', function () {
    // Create users with known XP values
    $user1 = User::factory()->create(['total_xp' => 7_000_000]);
    $user1->assignRole('student');

    $user2 = User::factory()->create(['total_xp' => 9_000_000]);
    $user2->assignRole('student');

    $user3 = User::factory()->create(['total_xp' => 8_000_000]);
    $user3->assignRole('student');

    $this->actingAs($user1)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('global_leaderboard')
                ->where('global_leaderboard.0.xp', 9_000_000) // user2 is first
                ->where('global_leaderboard.0.rank', 1)
                ->where('global_leaderboard.1.xp', 8_000_000) // user3 is second
                ->where('global_leaderboard.1.rank', 2)
                ->where('global_leaderboard.2.xp', 7_000_000)  // user1 is third
                ->where('global_leaderboard.2.rank', 3)
        );
});

test('leaderboard shows correct current user indicator', function () {
    $currentUser = User::factory()->create(['total_xp' => 8_000_000]);
    $currentUser->assignRole('student');

    $otherUser = User::factory()->create(['total_xp' => 9_000_000]);
    $otherUser->assignRole('student');

    $this->actingAs($currentUser)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('global_leaderboard')
                ->where('global_leaderboard.0.isCurrentUser', false) // otherUser is first
                ->where('global_leaderboard.1.isCurrentUser', true)  // currentUser is second
        );
});

test('completing daily task awards XP and updates leaderboard position', function () {
    // Create user initially with lower XP
    $user = User::factory()->create([
        'total_xp' => 9_000_000,
    ]);
    $user->assignRole('student');

    // Create competitor with slightly higher XP
    $competitor = User::factory()->create([
        'total_xp' => 9_000_100,
    ]);
    $competitor->assignRole('student');

    // Use the same timezone as the dashboard controller
    $taskTimezone = config('gamification.daily_tasks.timezone', 'Asia/Jakarta');
    $taskToday = now($taskTimezone)->toDateString();

    // Create a task worth enough XP to overtake competitor
    $task = DailyTask::factory()->for($user)->create([
        'is_completed' => false,
        'xp_reward' => 200,
        'due_date' => $taskToday,
    ]);

    $initialRank = User::where('total_xp', '>', $user->total_xp)->count() + 1;
    expect($initialRank)->toBe(2);

    // Complete the task
    $this->actingAs($user)
        ->patch(route('tasks.toggle', $task), ['completed' => true])
        ->assertRedirect();

    // Refresh user and verify XP was awarded (at least task XP, may include achievement bonuses)
    $user->refresh();
    expect($user->total_xp)->toBeGreaterThanOrEqual(9_000_200);

    $updatedRank = User::where('total_xp', '>', $user->total_xp)->count() + 1;
    expect($updatedRank)->toBe(1);

    // Verify dashboard shows updated leaderboard with user at rank 1
    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('global_leaderboard')
                ->where('global_leaderboard.0.id', $user->id)
                ->where('global_leaderboard.0.isCurrentUser', true)
                ->where('current_user_rank', 1)
        );
});
