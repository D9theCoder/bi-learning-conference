<?php

namespace App\Http\Controllers;

use App\Http\Requests\ToggleTaskCompletionRequest;
use App\Models\Activity;
use App\Models\DailyTask;
use App\Services\AchievementProgressService;
use App\Services\DailyTaskGeneratorService;
use App\Services\GamificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DailyTaskController extends Controller
{
    public function __construct(
        protected GamificationService $gamificationService,
        protected AchievementProgressService $achievementService,
        protected DailyTaskGeneratorService $taskGeneratorService
    ) {}

    public function toggleComplete(ToggleTaskCompletionRequest $request, DailyTask $task): RedirectResponse
    {
        $user = $request->user();
        $wasCompleted = $task->is_completed;
        $isNowCompleted = $request->boolean('completed');

        $task->is_completed = $isNowCompleted;
        $task->completed_at = $isNowCompleted ? now() : null;
        $task->save();

        if ($isNowCompleted && ! $wasCompleted && $task->xp_reward > 0) {
            Activity::create([
                'user_id' => $user->id,
                'type' => 'task_completed',
                'title' => 'Task Completed',
                'description' => "Completed task: {$task->title}",
                'xp_earned' => $task->xp_reward,
                'icon' => '✅',
                'metadata' => [
                    'task_id' => $task->id,
                    'task_type' => $task->type,
                ],
            ]);

            $this->gamificationService->awardXp(
                $user,
                $task->xp_reward,
                'task_completed',
                "Completed task: {$task->title}"
            );

            $this->achievementService->trackProgress($user, 'tasks_completed', 1);

            if ($task->type === 'lesson') {
                $this->achievementService->trackProgress($user, 'lessons_completed', 1);

                if ($task->lesson_id) {
                    $this->markLessonCompleted($user, $task);
                }
            }

            $this->checkDailyTasksComplete($user);
        }

        return back();
    }

    /**
     * Mark lesson-related content as completed.
     */
    protected function markLessonCompleted($user, DailyTask $task): void
    {
        $lesson = $task->lesson;

        if (! $lesson) {
            return;
        }

        Activity::create([
            'user_id' => $user->id,
            'type' => 'lesson_completed',
            'title' => 'Lesson Completed',
            'description' => "Completed lesson: {$lesson->title}",
            'xp_earned' => 0,
            'icon' => '📚',
            'metadata' => [
                'lesson_id' => $lesson->id,
                'course_id' => $lesson->course_id,
            ],
        ]);

        $this->updateEnrollmentProgress($user, $lesson);
    }

    /**
     * Update enrollment progress when a lesson is completed.
     */
    protected function updateEnrollmentProgress($user, $lesson): void
    {
        $course = $lesson->course;
        $enrollment = $user->enrollments()
            ->where('course_id', $course->id)
            ->first();

        if (! $enrollment) {
            return;
        }

        $totalLessons = $course->lessons()->count();
        $completedLessons = $user->dailyTasks()
            ->where('type', 'lesson')
            ->where('is_completed', true)
            ->whereHas('lesson', fn($q) => $q->where('course_id', $course->id))
            ->count();

        $progressPercentage = $totalLessons > 0
            ? round(($completedLessons / $totalLessons) * 100, 2)
            : 0;

        $enrollment->progress_percentage = $progressPercentage;
        $enrollment->last_activity_at = now();

        if ($progressPercentage >= 100 && $enrollment->status === 'active') {
            $enrollment->status = 'completed';
            $enrollment->completed_at = now();

            $this->achievementService->trackProgress($user, 'courses_completed', 1);

            Activity::create([
                'user_id' => $user->id,
                'type' => 'course_completed',
                'title' => 'Course Completed! 🎓',
                'description' => "Completed course: {$course->title}",
                'xp_earned' => 100,
                'icon' => '🎓',
                'metadata' => [
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                ],
            ]);

            $this->gamificationService->awardXp($user, 100, 'course_completed', "Completed course: {$course->title}");
        }

        $enrollment->save();
    }

    /**
     * Check if all daily tasks are completed and track achievement.
     */
    protected function checkDailyTasksComplete($user): void
    {
        $taskToday = $this->taskGeneratorService->getTaskDate()->toDateString();
        $todayTasks = $user->dailyTasks()->whereDate('due_date', $taskToday)->get();

        if ($todayTasks->isEmpty()) {
            return;
        }

        $allCompleted = $todayTasks->every(fn($task) => $task->is_completed);

        if ($allCompleted) {
            $this->achievementService->trackProgress($user, 'daily_all_tasks', 1);
        }
    }

    /**
     * Generate daily tasks for the current user (debug endpoint).
     */
    public function generate(Request $request): RedirectResponse
    {
        $user = $request->user();

        $generatedTasks = $this->taskGeneratorService->generateForUser($user);

        $count = $generatedTasks->count();

        if ($count > 0) {
            session()->flash('success', "Generated {$count} daily tasks!");
        } else {
            session()->flash('info', 'Tasks already exist for today or no courses enrolled.');
        }

        return back();
    }

    /**
     * Force regenerate daily tasks (deletes existing and creates new).
     */
    public function forceGenerate(Request $request): RedirectResponse
    {
        $user = $request->user();
        $taskDate = $this->taskGeneratorService->getTaskDate();

        $deleted = $user->dailyTasks()
            ->whereDate('due_date', $taskDate)
            ->delete();

        $generatedTasks = $this->taskGeneratorService->generateForUser($user);
        $count = $generatedTasks->count();

        session()->flash('success', "Regenerated {$count} daily tasks! ({$deleted} old tasks removed)");

        return back();
    }
}
