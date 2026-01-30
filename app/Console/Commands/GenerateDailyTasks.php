<?php

namespace App\Console\Commands;

use App\Services\DailyTaskGeneratorService;
use App\Services\GamificationService;
use Illuminate\Console\Command;

class GenerateDailyTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:generate
                            {--cleanup : Also cleanup old incomplete tasks}
                            {--reset-streaks : Also reset inactive user streaks}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily tasks for all active students and optionally maintain streaks';

    /**
     * Execute the console command.
     */
    public function handle(DailyTaskGeneratorService $taskGenerator, GamificationService $gamification): int
    {
        $this->info('Starting daily task generation...');

        $result = $taskGenerator->generateForAllStudents();

        $this->info("Tasks generated for {$result['generated']} students.");
        $this->info("Skipped {$result['skipped']} students (already have tasks).");

        if ($this->option('cleanup')) {
            $this->info('Cleaning up old incomplete tasks...');
            $deleted = $taskGenerator->cleanupOldTasks(7);
            $this->info("Deleted {$deleted} old incomplete tasks.");
        }

        if ($this->option('reset-streaks')) {
            $this->info('Resetting inactive streaks...');
            $resetCount = $gamification->resetInactiveStreaks();
            $this->info("Reset streaks for {$resetCount} inactive users.");
        }

        $this->info('Daily task generation complete!');

        return Command::SUCCESS;
    }
}
