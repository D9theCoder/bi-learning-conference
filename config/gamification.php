<?php

return [

    /*
    |--------------------------------------------------------------------------
    | XP & Level Configuration
    |--------------------------------------------------------------------------
    |
    | These values control how XP requirements scale per level and how point
    | rewards are calculated when a user levels up.
    |
    | Formula: xpForLevel(n) = base_xp * (xp_multiplier ^ (n - 2))
    | Example: Level 1→2 = 75, Level 2→3 = 113, Level 3→4 = 169, etc.
    |
    */

    'base_xp' => 75,
    'xp_multiplier' => 1.5,

    /*
    |--------------------------------------------------------------------------
    | Points Reward on Level Up
    |--------------------------------------------------------------------------
    |
    | Points awarded when a user levels up. Scales with level.
    |
    | Formula: pointsForLevel(n) = base_points * (points_multiplier ^ (n - 2))
    | Example: Level 2 = 150, Level 3 = 195, Level 4 = 254, etc.
    |
    */

    'base_points' => 150,
    'points_multiplier' => 1.3,

    /*
    |--------------------------------------------------------------------------
    | Daily Task Configuration
    |--------------------------------------------------------------------------
    |
    | Control how daily tasks are generated and their XP rewards.
    |
    */

    'daily_tasks' => [
        'min_tasks' => 3,
        'max_tasks' => 5,
        'reset_time' => '03:00', // 3am
        'timezone' => 'Asia/Jakarta', // GMT+7

        'xp_rewards' => [
            'lesson' => ['min' => 15, 'max' => 30],
            'quiz' => ['min' => 20, 'max' => 40],
            'practice' => ['min' => 10, 'max' => 25],
            'reading' => ['min' => 10, 'max' => 20],
        ],

        'estimated_minutes' => [
            'lesson' => ['min' => 15, 'max' => 45],
            'quiz' => ['min' => 10, 'max' => 30],
            'practice' => ['min' => 15, 'max' => 30],
            'reading' => ['min' => 10, 'max' => 20],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Streak Configuration
    |--------------------------------------------------------------------------
    |
    | Control streak behavior and bonuses.
    |
    */

    'streak' => [
        'grace_hours' => 24, // Hours of inactivity before streak resets
        'milestone_bonuses' => [
            7 => 50,   // 7-day streak: +50 XP bonus
            14 => 100, // 14-day streak: +100 XP bonus
            30 => 250, // 30-day streak: +250 XP bonus
            60 => 500, // 60-day streak: +500 XP bonus
            90 => 750, // 90-day streak: +750 XP bonus
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Achievement Categories
    |--------------------------------------------------------------------------
    |
    | Define achievement category types and their tracking methods.
    | The 'criteria' field in achievements should be a JSON object like:
    | {"type": "lessons_completed", "target": 5}
    |
    */

    'achievement_categories' => [
        'lessons' => [
            'label' => 'Lessons Completed',
            'types' => ['lessons_completed', 'first_lesson'],
        ],
        'courses' => [
            'label' => 'Course Progress',
            'types' => ['courses_completed', 'courses_enrolled'],
        ],
        'quizzes' => [
            'label' => 'Quiz Performance',
            'types' => ['quizzes_completed', 'perfect_quiz'],
        ],
        'streak' => [
            'label' => 'Consistency',
            'types' => ['streak_days', 'weekly_login'],
        ],
        'xp' => [
            'label' => 'Experience',
            'types' => ['total_xp_earned', 'level_reached'],
        ],
        'tasks' => [
            'label' => 'Daily Tasks',
            'types' => ['tasks_completed', 'daily_all_tasks'],
        ],
        'general' => [
            'label' => 'General',
            'types' => ['general'],
        ],
    ],

];
