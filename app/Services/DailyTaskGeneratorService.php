<?php

namespace App\Services;

use App\Models\DailyTask;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DailyTaskGeneratorService
{
    /**
     * Get the reset time for the configured timezone.
     */
    public function getResetTime(): Carbon
    {
        $timezone = config('gamification.daily_tasks.timezone', 'Asia/Jakarta');
        $resetTime = config('gamification.daily_tasks.reset_time', '03:00');

        return Carbon::parse($resetTime, $timezone);
    }

    /**
     * Get today's date based on the reset time configuration.
     * If current time is before reset time, use yesterday's date.
     */
    public function getTaskDate(): Carbon
    {
        $timezone = config('gamification.daily_tasks.timezone', 'Asia/Jakarta');
        $resetTime = config('gamification.daily_tasks.reset_time', '03:00');

        $now = Carbon::now($timezone);
        $todayReset = Carbon::parse($now->toDateString().' '.$resetTime, $timezone);

        if ($now->lt($todayReset)) {
            return $now->copy()->subDay()->startOfDay();
        }

        return $now->copy()->startOfDay();
    }

    /**
     * Generate daily tasks for a single user.
     *
     * @return Collection<int, DailyTask>
     */
    public function generateForUser(User $user): Collection
    {
        $taskDate = $this->getTaskDate();

        $existingTasksCount = $user->dailyTasks()
            ->whereDate('due_date', $taskDate)
            ->count();

        if ($existingTasksCount > 0) {
            return collect();
        }

        $activeEnrollments = $user->activeEnrollments()->with(['course.lessons'])->get();

        if ($activeEnrollments->isEmpty()) {
            return $this->generateGenericTasks($user, $taskDate);
        }

        return $this->generateCourseTasks($user, $activeEnrollments, $taskDate);
    }

    /**
     * Generate tasks based on user's enrolled courses.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, \App\Models\Enrollment>  $enrollments
     * @return Collection<int, DailyTask>
     */
    protected function generateCourseTasks(User $user, $enrollments, Carbon $taskDate): Collection
    {
        $minTasks = config('gamification.daily_tasks.min_tasks', 3);
        $maxTasks = config('gamification.daily_tasks.max_tasks', 5);
        $targetTaskCount = rand($minTasks, $maxTasks);

        $tasks = collect();

        $completedLessonIds = $user->dailyTasks()
            ->whereNotNull('lesson_id')
            ->where('is_completed', true)
            ->pluck('lesson_id')
            ->toArray();

        foreach ($enrollments as $enrollment) {
            if ($tasks->count() >= $targetTaskCount) {
                break;
            }

            $course = $enrollment->course;
            $nextLesson = $course->lessons()
                ->whereNotIn('id', $completedLessonIds)
                ->orderBy('order')
                ->first();

            if ($nextLesson) {
                $tasks->push($this->createLessonTask($user, $nextLesson, $course, $taskDate));
                $completedLessonIds[] = $nextLesson->id;
            }
        }

        while ($tasks->count() < $targetTaskCount) {
            $taskTypes = ['quiz', 'practice', 'reading'];
            $type = $taskTypes[array_rand($taskTypes)];

            $randomEnrollment = $enrollments->random();
            $course = $randomEnrollment->course;

            $tasks->push($this->createSupplementaryTask($user, $type, $course, $taskDate));
        }

        return $tasks;
    }

    /**
     * Generate generic tasks when user has no active enrollments.
     *
     * @return Collection<int, DailyTask>
     */
    protected function generateGenericTasks(User $user, Carbon $taskDate): Collection
    {
        $tasks = collect();

        $genericTasks = [
            [
                'title' => 'Browse Available Courses',
                'description' => 'Explore the course catalog and find something interesting to learn',
                'type' => 'reading',
            ],
            [
                'title' => 'Review Learning Resources',
                'description' => 'Check out helpful learning materials and tips',
                'type' => 'reading',
            ],
            [
                'title' => 'Set Your Learning Goals',
                'description' => 'Think about what you want to achieve this week',
                'type' => 'practice',
            ],
        ];

        foreach ($genericTasks as $taskData) {
            $xpRange = config('gamification.daily_tasks.xp_rewards.'.$taskData['type'], ['min' => 10, 'max' => 20]);
            $minutesRange = config('gamification.daily_tasks.estimated_minutes.'.$taskData['type'], ['min' => 10, 'max' => 20]);

            $tasks->push(DailyTask::create([
                'user_id' => $user->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'type' => $taskData['type'],
                'lesson_id' => null,
                'estimated_minutes' => rand($minutesRange['min'], $minutesRange['max']),
                'xp_reward' => rand($xpRange['min'], $xpRange['max']),
                'is_completed' => false,
                'due_date' => $taskDate,
            ]));
        }

        return $tasks;
    }

    /**
     * Create a lesson-based task.
     */
    protected function createLessonTask(User $user, $lesson, $course, Carbon $taskDate): DailyTask
    {
        $xpRange = config('gamification.daily_tasks.xp_rewards.lesson', ['min' => 15, 'max' => 30]);
        $minutesRange = config('gamification.daily_tasks.estimated_minutes.lesson', ['min' => 15, 'max' => 45]);

        $estimatedMinutes = $lesson->duration_minutes ?? rand($minutesRange['min'], $minutesRange['max']);

        return DailyTask::create([
            'user_id' => $user->id,
            'title' => "Complete: {$lesson->title}",
            'description' => "Continue your progress in {$course->title}",
            'type' => 'lesson',
            'lesson_id' => $lesson->id,
            'estimated_minutes' => $estimatedMinutes,
            'xp_reward' => rand($xpRange['min'], $xpRange['max']),
            'is_completed' => false,
            'due_date' => $taskDate,
        ]);
    }

    /**
     * Create a supplementary task (quiz, practice, reading).
     */
    protected function createSupplementaryTask(User $user, string $type, $course, Carbon $taskDate): DailyTask
    {
        $xpRange = config('gamification.daily_tasks.xp_rewards.'.$type, ['min' => 10, 'max' => 25]);
        $minutesRange = config('gamification.daily_tasks.estimated_minutes.'.$type, ['min' => 10, 'max' => 30]);

        $titles = [
            'quiz' => "Quiz Practice: {$course->title}",
            'practice' => "Practice Session: {$course->title}",
            'reading' => "Review Materials: {$course->title}",
        ];

        $descriptions = [
            'quiz' => 'Test your knowledge with a quick quiz',
            'practice' => 'Apply what you\'ve learned with hands-on practice',
            'reading' => 'Review course materials and notes',
        ];

        return DailyTask::create([
            'user_id' => $user->id,
            'title' => $titles[$type] ?? "Task: {$course->title}",
            'description' => $descriptions[$type] ?? 'Complete this learning task',
            'type' => $type,
            'lesson_id' => null,
            'estimated_minutes' => rand($minutesRange['min'], $minutesRange['max']),
            'xp_reward' => rand($xpRange['min'], $xpRange['max']),
            'is_completed' => false,
            'due_date' => $taskDate,
        ]);
    }

    /**
     * Generate daily tasks for all active students.
     *
     * @return array{generated: int, skipped: int}
     */
    public function generateForAllStudents(): array
    {
        $students = User::role('student')
            ->whereHas('enrollments', fn ($q) => $q->where('status', 'active'))
            ->get();

        $generated = 0;
        $skipped = 0;

        foreach ($students as $student) {
            $tasks = $this->generateForUser($student);

            if ($tasks->count() > 0) {
                $generated++;
            } else {
                $skipped++;
            }
        }

        return [
            'generated' => $generated,
            'skipped' => $skipped,
        ];
    }

    /**
     * Clean up old incomplete tasks (optional, for maintenance).
     */
    public function cleanupOldTasks(int $daysOld = 7): int
    {
        $cutoffDate = Carbon::now()->subDays($daysOld);

        return DailyTask::where('due_date', '<', $cutoffDate)
            ->where('is_completed', false)
            ->delete();
    }
}
