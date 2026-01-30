<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            AchievementSeeder::class,
            RewardSeeder::class,
            PowerupSeeder::class,
            TestUserSeeder::class,
            CourseSeeder::class,
            CourseContentSeeder::class,
            StudentSeeder::class,
            StudentMeetingScheduleSeeder::class,
        ]);
    }
}
