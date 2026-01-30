<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\User;
use Carbon\Carbon;

class GamificationService
{
    /**
     * Calculate XP required to reach a specific level.
     */
    public function xpForLevel(int $level): int
    {
        if ($level <= 1) {
            return 0;
        }

        $baseXp = config('gamification.base_xp', 75);
        $multiplier = config('gamification.xp_multiplier', 1.5);

        return (int) round($baseXp * pow($multiplier, $level - 2));
    }

    /**
     * Calculate total XP required to reach a specific level from level 1.
     */
    public function totalXpForLevel(int $level): int
    {
        $total = 0;
        for ($i = 2; $i <= $level; $i++) {
            $total += $this->xpForLevel($i);
        }

        return $total;
    }

    /**
     * Calculate current level based on total XP.
     */
    public function calculateLevelFromXp(int $totalXp): int
    {
        $level = 1;
        $cumulativeXp = 0;

        while (true) {
            $xpForNextLevel = $this->xpForLevel($level + 1);
            if ($cumulativeXp + $xpForNextLevel > $totalXp) {
                break;
            }
            $cumulativeXp += $xpForNextLevel;
            $level++;
        }

        return $level;
    }

    /**
     * Get XP progress within current level (0 to xpForNextLevel).
     */
    public function xpProgressInCurrentLevel(int $totalXp, int $currentLevel): int
    {
        $xpToReachCurrentLevel = $this->totalXpForLevel($currentLevel);

        return $totalXp - $xpToReachCurrentLevel;
    }

    /**
     * Calculate points reward for leveling up to a specific level.
     */
    public function pointsForLevelUp(int $newLevel): int
    {
        if ($newLevel <= 1) {
            return 0;
        }

        $basePoints = config('gamification.base_points', 150);
        $multiplier = config('gamification.points_multiplier', 1.3);

        return (int) round($basePoints * pow($multiplier, $newLevel - 2));
    }

    public function awardAssessmentPoints(User $user, string $assessmentType, int $score, int $maxScore, bool $isRemedial): int
    {
        if ($isRemedial) {
            return 0;
        }

        $percentage = $maxScore > 0 ? ($score / $maxScore) : 0;

        $points = match ($assessmentType) {
            'practice' => 150,
            'quiz' => (int) round(200 + (100 * $percentage)),
            'final_exam' => (int) round(400 + (600 * $percentage)),
            default => 0,
        };

        $user->points_balance = ($user->points_balance ?? 0) + $points;
        $user->save();

        return $points;
    }

    /**
     * Award XP to a user and handle level-ups.
     *
     * @return array{xp_awarded: int, leveled_up: bool, new_level: int|null, points_earned: int}
     */
    public function awardXp(User $user, int $xp, string $source = 'task_completed', ?string $description = null): array
    {
        return $this->doAwardXp($user, $xp, $source, $description, true);
    }

    /**
     * Award XP without updating streak (used to prevent recursion from streak milestones).
     */
    protected function awardXpWithoutStreak(User $user, int $xp): void
    {
        $this->doAwardXp($user, $xp, 'streak_milestone', null, false);
    }

    /**
     * Internal method to award XP with optional streak update.
     *
     * @return array{xp_awarded: int, leveled_up: bool, new_level: int|null, points_earned: int}
     */
    protected function doAwardXp(User $user, int $xp, string $source, ?string $description, bool $updateStreak): array
    {
        $oldLevel = $user->level ?? 1;
        $newTotalXp = ($user->total_xp ?? 0) + $xp;

        $user->total_xp = $newTotalXp;
        $user->save();

        $newLevel = $this->calculateLevelFromXp($newTotalXp);
        $leveledUp = $newLevel > $oldLevel;
        $pointsEarned = 0;

        if ($leveledUp) {
            $totalPointsEarned = 0;
            for ($lvl = $oldLevel + 1; $lvl <= $newLevel; $lvl++) {
                $totalPointsEarned += $this->pointsForLevelUp($lvl);
            }

            $user->level = $newLevel;
            $user->points_balance = ($user->points_balance ?? 0) + $totalPointsEarned;
            $user->save();

            $pointsEarned = $totalPointsEarned;

            Activity::create([
                'user_id' => $user->id,
                'type' => 'level_up',
                'title' => "Level Up! Now Level {$newLevel}",
                'description' => "Reached level {$newLevel} and earned {$totalPointsEarned} points!",
                'xp_earned' => 0,
                'icon' => '🎉',
                'metadata' => [
                    'old_level' => $oldLevel,
                    'new_level' => $newLevel,
                    'points_earned' => $totalPointsEarned,
                ],
            ]);
        }

        if ($updateStreak) {
            $this->updateStreak($user);
        }

        return [
            'xp_awarded' => $xp,
            'leveled_up' => $leveledUp,
            'new_level' => $leveledUp ? $newLevel : null,
            'points_earned' => $pointsEarned,
        ];
    }

    /**
     * Update user's streak based on activity.
     */
    public function updateStreak(User $user): void
    {
        $today = Carbon::now(config('gamification.daily_tasks.timezone', 'Asia/Jakarta'))->toDateString();
        $lastActivity = $user->last_activity_date;

        if ($lastActivity === null) {
            $user->current_streak = 1;
            $user->longest_streak = max($user->longest_streak ?? 0, 1);
            $user->last_activity_date = $today;
            $user->save();

            return;
        }

        $lastActivityDate = Carbon::parse($lastActivity)->startOfDay();
        $todayDate = Carbon::parse($today)->startOfDay();
        $daysDiff = $lastActivityDate->diffInDays($todayDate);

        if ($daysDiff === 0) {
            return;
        }

        if ($daysDiff === 1) {
            $user->current_streak = ($user->current_streak ?? 0) + 1;
            $user->longest_streak = max($user->longest_streak ?? 0, $user->current_streak);
        } else {
            $user->current_streak = 1;
        }

        $user->last_activity_date = $today;
        $user->save();

        $this->checkStreakMilestones($user);
    }

    /**
     * Check and award streak milestone bonuses.
     */
    protected function checkStreakMilestones(User $user): void
    {
        $milestones = config('gamification.streak.milestone_bonuses', []);
        $currentStreak = $user->current_streak ?? 0;

        foreach ($milestones as $days => $bonusXp) {
            if ($currentStreak === $days) {
                Activity::create([
                    'user_id' => $user->id,
                    'type' => 'streak_milestone',
                    'title' => "{$days}-Day Streak! 🔥",
                    'description' => "Maintained a {$days}-day streak and earned {$bonusXp} bonus XP!",
                    'xp_earned' => $bonusXp,
                    'icon' => '🔥',
                    'metadata' => [
                        'streak_days' => $days,
                        'bonus_xp' => $bonusXp,
                    ],
                ]);

                // Award XP directly without calling updateStreak again to prevent recursion
                $this->awardXpWithoutStreak($user, $bonusXp);
                break;
            }
        }
    }

    /**
     * Reset streaks for users who haven't been active.
     * Called by scheduled job.
     */
    public function resetInactiveStreaks(): int
    {
        $timezone = config('gamification.daily_tasks.timezone', 'Asia/Jakarta');
        $graceHours = config('gamification.streak.grace_hours', 24);

        $cutoffDate = Carbon::now($timezone)->subHours($graceHours)->toDateString();

        $affectedUsers = User::where('current_streak', '>', 0)
            ->where(function ($query) use ($cutoffDate) {
                $query->where('last_activity_date', '<', $cutoffDate)
                    ->orWhereNull('last_activity_date');
            })
            ->update(['current_streak' => 0]);

        return $affectedUsers;
    }

    /**
     * Get level progress information for display.
     *
     * @return array{current_level: int, total_xp: int, xp_in_level: int, xp_for_next_level: int, progress_percentage: float}
     */
    public function getLevelProgress(User $user): array
    {
        $totalXp = $user->total_xp ?? 0;
        $currentLevel = $user->level ?? 1;
        $xpInLevel = $this->xpProgressInCurrentLevel($totalXp, $currentLevel);
        $xpForNextLevel = $this->xpForLevel($currentLevel + 1);

        $progressPercentage = $xpForNextLevel > 0
            ? round(($xpInLevel / $xpForNextLevel) * 100, 1)
            : 0;

        return [
            'current_level' => $currentLevel,
            'total_xp' => $totalXp,
            'xp_in_level' => $xpInLevel,
            'xp_for_next_level' => $xpForNextLevel,
            'progress_percentage' => $progressPercentage,
        ];
    }
}
