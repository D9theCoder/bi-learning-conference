<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AchievementProgressService
{
    public function __construct(
        protected GamificationService $gamificationService
    ) {}

    /**
     * Track progress for a specific achievement type.
     * Automatically awards achievements when targets are met.
     *
     * @param  array<string, mixed>  $context  Additional context for the achievement
     */
    public function trackProgress(User $user, string $type, int $incrementBy = 1, array $context = []): void
    {
        $achievements = Achievement::whereNotNull('criteria')
            ->where('criteria', '!=', '')
            ->where(function ($query) use ($type) {
                $query->where('criteria', 'like', '%"type":"'.$type.'"%')
                    ->orWhere('criteria', 'like', '%"type": "'.$type.'"%');
            })
            ->get();

        foreach ($achievements as $achievement) {
            $this->updateAchievementProgress($user, $achievement, $incrementBy, $context);
        }
    }

    /**
     * Update progress for a specific achievement.
     */
    protected function updateAchievementProgress(User $user, Achievement $achievement, int $incrementBy, array $context = []): void
    {
        $criteria = $achievement->parsedCriteria();

        if ($criteria === null) {
            return;
        }

        $pivot = DB::table('achievement_user')
            ->where('achievement_id', $achievement->id)
            ->where('user_id', $user->id)
            ->first();

        if ($pivot && $pivot->earned_at !== null) {
            return;
        }

        $currentProgress = $pivot ? $pivot->progress : 0;
        $newProgress = min($currentProgress + $incrementBy, $achievement->target);

        if ($pivot) {
            DB::table('achievement_user')
                ->where('achievement_id', $achievement->id)
                ->where('user_id', $user->id)
                ->update([
                    'progress' => $newProgress,
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('achievement_user')->insert([
                'achievement_id' => $achievement->id,
                'user_id' => $user->id,
                'progress' => $newProgress,
                'earned_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if ($newProgress >= $achievement->target) {
            $this->awardAchievement($user, $achievement);
        }
    }

    /**
     * Award an achievement to a user.
     */
    public function awardAchievement(User $user, Achievement $achievement): void
    {
        DB::table('achievement_user')
            ->where('achievement_id', $achievement->id)
            ->where('user_id', $user->id)
            ->update([
                'earned_at' => now(),
                'progress' => $achievement->target,
                'updated_at' => now(),
            ]);

        Activity::create([
            'user_id' => $user->id,
            'type' => 'achievement_earned',
            'title' => "Achievement Unlocked: {$achievement->name}",
            'description' => $achievement->description,
            'xp_earned' => $achievement->xp_reward,
            'icon' => $achievement->icon,
            'metadata' => [
                'achievement_id' => $achievement->id,
                'achievement_name' => $achievement->name,
                'rarity' => $achievement->rarity,
            ],
        ]);

        if ($achievement->xp_reward > 0) {
            $this->gamificationService->awardXp(
                $user,
                $achievement->xp_reward,
                'achievement_earned',
                "Earned achievement: {$achievement->name}"
            );
        }
    }

    /**
     * Get all achievements with user progress.
     *
     * @return \Illuminate\Support\Collection<int, array{achievement: Achievement, progress: int, earned: bool, earned_at: string|null}>
     */
    public function getAchievementsWithProgress(User $user): \Illuminate\Support\Collection
    {
        $achievements = Achievement::all();

        $userProgress = DB::table('achievement_user')
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('achievement_id');

        return $achievements->map(function ($achievement) use ($userProgress) {
            $pivot = $userProgress->get($achievement->id);

            return [
                'achievement' => $achievement,
                'progress' => $pivot ? $pivot->progress : 0,
                'earned' => $pivot && $pivot->earned_at !== null,
                'earned_at' => $pivot?->earned_at,
            ];
        });
    }

    /**
     * Get achievements for dashboard display (in-progress and recent).
     *
     * @return array{in_progress: \Illuminate\Support\Collection, recent: \Illuminate\Support\Collection}
     */
    public function getDashboardAchievements(User $user, int $inProgressLimit = 3, int $recentLimit = 3): array
    {
        $achievementsWithProgress = $this->getAchievementsWithProgress($user);

        $inProgress = $achievementsWithProgress
            ->filter(fn ($item) => ! $item['earned'] && $item['progress'] > 0)
            ->sortByDesc('progress')
            ->take($inProgressLimit)
            ->map(fn ($item) => array_merge($item['achievement']->toArray(), [
                'progress' => $item['progress'],
                'earned' => false,
                'earned_at' => null,
            ]));

        $recent = $achievementsWithProgress
            ->filter(fn ($item) => $item['earned'])
            ->sortByDesc('earned_at')
            ->take($recentLimit)
            ->map(fn ($item) => array_merge($item['achievement']->toArray(), [
                'progress' => $item['progress'],
                'earned' => true,
                'earned_at' => $item['earned_at'],
            ]));

        return [
            'in_progress' => $inProgress->values(),
            'recent' => $recent->values(),
        ];
    }

    /**
     * Sync achievement progress from existing data.
     * Useful for initializing progress for existing users.
     */
    public function syncProgressFromData(User $user): void
    {
        $lessonsCompleted = $user->dailyTasks()
            ->where('type', 'lesson')
            ->where('is_completed', true)
            ->count();

        if ($lessonsCompleted > 0) {
            $this->setProgress($user, 'lessons_completed', $lessonsCompleted);
        }

        $coursesCompleted = $user->enrollments()
            ->where('status', 'completed')
            ->count();

        if ($coursesCompleted > 0) {
            $this->setProgress($user, 'courses_completed', $coursesCompleted);
        }

        $coursesEnrolled = $user->enrollments()->count();

        if ($coursesEnrolled > 0) {
            $this->setProgress($user, 'courses_enrolled', $coursesEnrolled);
        }

        $tasksCompleted = $user->dailyTasks()
            ->where('is_completed', true)
            ->count();

        if ($tasksCompleted > 0) {
            $this->setProgress($user, 'tasks_completed', $tasksCompleted);
        }

        if ($user->current_streak > 0) {
            $this->setProgress($user, 'streak_days', $user->current_streak);
        }

        if ($user->total_xp > 0) {
            $this->setProgress($user, 'total_xp_earned', $user->total_xp);
        }

        if ($user->level > 1) {
            $this->setProgress($user, 'level_reached', $user->level);
        }
    }

    /**
     * Set absolute progress for an achievement type (not increment).
     */
    protected function setProgress(User $user, string $type, int $absoluteProgress): void
    {
        $achievements = Achievement::whereNotNull('criteria')
            ->where('criteria', '!=', '')
            ->where(function ($query) use ($type) {
                $query->where('criteria', 'like', '%"type":"'.$type.'"%')
                    ->orWhere('criteria', 'like', '%"type": "'.$type.'"%');
            })
            ->get();

        foreach ($achievements as $achievement) {
            $pivot = DB::table('achievement_user')
                ->where('achievement_id', $achievement->id)
                ->where('user_id', $user->id)
                ->first();

            if ($pivot && $pivot->earned_at !== null) {
                continue;
            }

            $newProgress = min($absoluteProgress, $achievement->target);

            if ($pivot) {
                DB::table('achievement_user')
                    ->where('achievement_id', $achievement->id)
                    ->where('user_id', $user->id)
                    ->update([
                        'progress' => $newProgress,
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('achievement_user')->insert([
                    'achievement_id' => $achievement->id,
                    'user_id' => $user->id,
                    'progress' => $newProgress,
                    'earned_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if ($newProgress >= $achievement->target) {
                $this->awardAchievement($user, $achievement);
            }
        }
    }
}
