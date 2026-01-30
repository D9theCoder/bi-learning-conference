<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Achievement>
 */
class AchievementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $achievements = [
            [
                'name' => 'First Steps',
                'description' => 'Complete your first lesson',
                'icon' => '🎯',
                'category' => 'lessons',
                'target' => 1,
                'criteria' => ['type' => 'lessons_completed'],
                'rarity' => 'bronze',
                'xp_reward' => 50,
            ],
            [
                'name' => 'Week Warrior',
                'description' => 'Maintain a 7-day streak',
                'icon' => '🔥',
                'category' => 'streak',
                'target' => 7,
                'criteria' => ['type' => 'streak_days'],
                'rarity' => 'silver',
                'xp_reward' => 100,
            ],
            [
                'name' => 'Course Completer',
                'description' => 'Finish your first course',
                'icon' => '🎓',
                'category' => 'courses',
                'target' => 1,
                'criteria' => ['type' => 'courses_completed'],
                'rarity' => 'gold',
                'xp_reward' => 200,
            ],
            [
                'name' => 'Fast Learner',
                'description' => 'Complete 10 lessons',
                'icon' => '⚡',
                'category' => 'lessons',
                'target' => 10,
                'criteria' => ['type' => 'lessons_completed'],
                'rarity' => 'silver',
                'xp_reward' => 150,
            ],
            [
                'name' => 'Knowledge Seeker',
                'description' => 'Enroll in 5 different courses',
                'icon' => '📚',
                'category' => 'courses',
                'target' => 5,
                'criteria' => ['type' => 'courses_enrolled'],
                'rarity' => 'silver',
                'xp_reward' => 100,
            ],
            [
                'name' => 'Task Master',
                'description' => 'Complete 50 daily tasks',
                'icon' => '💪',
                'category' => 'tasks',
                'target' => 50,
                'criteria' => ['type' => 'tasks_completed'],
                'rarity' => 'gold',
                'xp_reward' => 250,
            ],
            [
                'name' => 'Dedicated Learner',
                'description' => 'Complete all daily tasks 5 times',
                'icon' => '🌟',
                'category' => 'tasks',
                'target' => 5,
                'criteria' => ['type' => 'daily_all_tasks'],
                'rarity' => 'silver',
                'xp_reward' => 150,
            ],
            [
                'name' => 'XP Hunter',
                'description' => 'Earn 1000 total XP',
                'icon' => '⭐',
                'category' => 'xp',
                'target' => 1000,
                'criteria' => ['type' => 'total_xp_earned'],
                'rarity' => 'bronze',
                'xp_reward' => 100,
            ],
            [
                'name' => 'Level 5 Scholar',
                'description' => 'Reach level 5',
                'icon' => '🏆',
                'category' => 'xp',
                'target' => 5,
                'criteria' => ['type' => 'level_reached'],
                'rarity' => 'silver',
                'xp_reward' => 200,
            ],
            [
                'name' => 'Month Master',
                'description' => 'Maintain a 30-day streak',
                'icon' => '🗓️',
                'category' => 'streak',
                'target' => 30,
                'criteria' => ['type' => 'streak_days'],
                'rarity' => 'gold',
                'xp_reward' => 300,
            ],
        ];

        $achievement = fake()->randomElement($achievements);

        return [
            'name' => $achievement['name'],
            'description' => $achievement['description'],
            'icon' => $achievement['icon'],
            'rarity' => $achievement['rarity'],
            'criteria' => $achievement['criteria'],
            'xp_reward' => $achievement['xp_reward'],
            'category' => $achievement['category'],
            'target' => $achievement['target'],
        ];
    }

    /**
     * Create a specific achievement type.
     */
    public function lessonsCompleted(int $target = 1): static
    {
        return $this->state(fn () => [
            'name' => "Complete {$target} Lesson".($target > 1 ? 's' : ''),
            'description' => "Complete {$target} lesson".($target > 1 ? 's' : '').' to earn this achievement',
            'icon' => '📖',
            'category' => 'lessons',
            'target' => $target,
            'criteria' => ['type' => 'lessons_completed'],
        ]);
    }

    /**
     * Create a streak achievement.
     */
    public function streakDays(int $days = 7): static
    {
        return $this->state(fn () => [
            'name' => "{$days}-Day Streak",
            'description' => "Maintain a {$days}-day learning streak",
            'icon' => '🔥',
            'category' => 'streak',
            'target' => $days,
            'criteria' => ['type' => 'streak_days'],
        ]);
    }

    /**
     * Create a tasks completed achievement.
     */
    public function tasksCompleted(int $target = 10): static
    {
        return $this->state(fn () => [
            'name' => "Task Champion ({$target})",
            'description' => "Complete {$target} daily tasks",
            'icon' => '✅',
            'category' => 'tasks',
            'target' => $target,
            'criteria' => ['type' => 'tasks_completed'],
        ]);
    }
}
