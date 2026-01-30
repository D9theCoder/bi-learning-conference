<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\CourseContent;
use App\Models\CourseContentCompletion;
use App\Models\DailyTask;
use App\Services\AchievementProgressService;
use App\Services\DailyTaskGeneratorService;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseContentController extends Controller
{
    public function __construct(
        protected GamificationService $gamificationService,
        protected AchievementProgressService $achievementService,
        protected DailyTaskGeneratorService $taskGeneratorService
    ) {}

    /**
     * Mark a course content as completed for the current user.
     */
    public function markComplete(Request $request, CourseContent $content): JsonResponse
    {
        $user = $request->user();
        $lesson = $content->lesson;

        if (! $lesson) {
            return response()->json(['message' => 'Content has no associated lesson'], 404);
        }

        $course = $lesson->course;

        $isEnrolled = $user->enrollments()
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();

        if (! $isEnrolled && ! $user->hasAnyRole(['admin', 'tutor'])) {
            return response()->json(['message' => 'Not enrolled in this course'], 403);
        }

        $completion = CourseContentCompletion::firstOrCreate(
            [
                'user_id' => $user->id,
                'course_content_id' => $content->id,
            ],
            [
                'completed_at' => now(),
            ]
        );

        $wasJustCompleted = $completion->wasRecentlyCreated;

        if ($wasJustCompleted) {
            $this->checkLessonCompletion($user, $lesson, $course);
        }

        return response()->json([
            'success' => true,
            'was_new' => $wasJustCompleted,
            'completion_id' => $completion->id,
        ]);
    }

    /**
     * Check if all required content in a lesson is completed and update daily task if so.
     */
    protected function checkLessonCompletion($user, $lesson, $course): void
    {
        $requiredContents = $lesson->contents()
            ->where('type', '!=', 'assessment')
            ->where('is_required', true)
            ->pluck('id');

        if ($requiredContents->isEmpty()) {
            $allContents = $lesson->contents()
                ->where('type', '!=', 'assessment')
                ->pluck('id');
            if ($allContents->isEmpty()) {
                return;
            }

            $completedCount = CourseContentCompletion::where('user_id', $user->id)
                ->whereIn('course_content_id', $allContents)
                ->count();

            $lessonCompleted = $completedCount >= $allContents->count();
        } else {
            $completedRequired = CourseContentCompletion::where('user_id', $user->id)
                ->whereIn('course_content_id', $requiredContents)
                ->count();

            $lessonCompleted = $completedRequired >= $requiredContents->count();
        }

        if ($lessonCompleted) {
            $this->completeLessonDailyTask($user, $lesson, $course);
        }
    }

    /**
     * Complete the daily task associated with this lesson.
     */
    protected function completeLessonDailyTask($user, $lesson, $course): void
    {
        $taskDate = $this->taskGeneratorService->getTaskDate()->toDateString();

        $dailyTask = DailyTask::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->where('is_completed', false)
            ->whereDate('due_date', $taskDate)
            ->first();

        if (! $dailyTask) {
            return;
        }

        $dailyTask->is_completed = true;
        $dailyTask->completed_at = now();
        $dailyTask->save();

        Activity::create([
            'user_id' => $user->id,
            'type' => 'task_completed',
            'title' => 'Task Completed',
            'description' => "Completed task: {$dailyTask->title}",
            'xp_earned' => $dailyTask->xp_reward,
            'icon' => '✅',
            'metadata' => [
                'task_id' => $dailyTask->id,
                'task_type' => $dailyTask->type,
                'auto_completed' => true,
            ],
        ]);

        $this->gamificationService->awardXp(
            $user,
            $dailyTask->xp_reward,
            'task_completed',
            "Completed task: {$dailyTask->title}"
        );

        $this->achievementService->trackProgress($user, 'tasks_completed', 1);
        $this->achievementService->trackProgress($user, 'lessons_completed', 1);

        Activity::create([
            'user_id' => $user->id,
            'type' => 'lesson_completed',
            'title' => 'Lesson Completed',
            'description' => "Completed lesson: {$lesson->title}",
            'xp_earned' => 0,
            'icon' => '📚',
            'metadata' => [
                'lesson_id' => $lesson->id,
                'course_id' => $course->id,
            ],
        ]);

        $this->updateEnrollmentProgress($user, $lesson, $course);
        $this->checkDailyTasksComplete($user);
    }

    /**
     * Update enrollment progress when a lesson is completed.
     */
    protected function updateEnrollmentProgress($user, $lesson, $course): void
    {
        $enrollment = $user->enrollments()
            ->where('course_id', $course->id)
            ->first();

        if (! $enrollment) {
            return;
        }

        $totalLessons = $course->lessons()->count();

        $completedLessonIds = DailyTask::where('user_id', $user->id)
            ->where('type', 'lesson')
            ->where('is_completed', true)
            ->whereHas('lesson', fn ($q) => $q->where('course_id', $course->id))
            ->pluck('lesson_id')
            ->unique();

        $completedLessons = $completedLessonIds->count();

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

        $allCompleted = $todayTasks->every(fn ($task) => $task->is_completed);

        if ($allCompleted) {
            $this->achievementService->trackProgress($user, 'daily_all_tasks', 1);
        }
    }
}
