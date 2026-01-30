<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
|
| Daily task generation runs at 3:00 AM Jakarta time (GMT+7).
| This generates new daily quests for all students with active enrollments
| and resets streaks for inactive users.
|
*/

Schedule::command('tasks:generate --cleanup --reset-streaks')
    ->dailyAt('03:00')
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping()
    ->onOneServer()
    ->appendOutputTo(storage_path('logs/daily-tasks.log'));
