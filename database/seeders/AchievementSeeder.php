<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
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
                'name' => 'Lesson Master',
                'description' => 'Complete 50 lessons',
                'icon' => '📚',
                'category' => 'lessons',
                'target' => 50,
                'criteria' => ['type' => 'lessons_completed'],
                'rarity' => 'gold',
                'xp_reward' => 300,
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
                'name' => 'Knowledge Seeker',
                'description' => 'Enroll in 5 different courses',
                'icon' => '📖',
                'category' => 'courses',
                'target' => 5,
                'criteria' => ['type' => 'courses_enrolled'],
                'rarity' => 'silver',
                'xp_reward' => 100,
            ],
            [
                'name' => 'Task Champion',
                'description' => 'Complete 10 daily tasks',
                'icon' => '✅',
                'category' => 'tasks',
                'target' => 10,
                'criteria' => ['type' => 'tasks_completed'],
                'rarity' => 'bronze',
                'xp_reward' => 75,
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
                'name' => 'Month Master',
                'description' => 'Maintain a 30-day streak',
                'icon' => '🗓️',
                'category' => 'streak',
                'target' => 30,
                'criteria' => ['type' => 'streak_days'],
                'rarity' => 'gold',
                'xp_reward' => 300,
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
                'name' => 'XP Champion',
                'description' => 'Earn 5000 total XP',
                'icon' => '🌟',
                'category' => 'xp',
                'target' => 5000,
                'criteria' => ['type' => 'total_xp_earned'],
                'rarity' => 'silver',
                'xp_reward' => 250,
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
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['name' => $achievement['name']],
                $achievement
            );
        }
    }
}
