<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\StudentMeetingSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isTutor = $user->hasRole('tutor');
        $isAdmin = $user->hasRole('admin');

        // Parse date from query or default to now
        $date = $request->input('date')
            ? Carbon::parse($request->input('date'))
            : now();

        // Get date range for the full calendar view (start of first week to end of last week)
        $start = $date->copy()->startOfMonth()->startOfWeek();
        $end = $date->copy()->endOfMonth()->endOfWeek();

        $calendarItems = collect();
        $courseMarkers = [];
        $paginatedCourses = null;

        if ($isTutor || $isAdmin) {
            $courseQuery = Course::with(['assessments']);

            if (! $isAdmin) {
                $courseQuery->where('instructor_id', $user->id);
            }

            $courses = $courseQuery->get();
            $courseIds = $courses->pluck('id')->values();

            $scheduleItems = StudentMeetingSchedule::query()
                ->with('course')
                ->whereIn('course_id', $courseIds)
                ->where('status', '!=', 'cancelled')
                ->whereBetween('scheduled_at', [$start, $end])
                ->get();

            foreach ($courses as $course) {
                // Add scheduled meetings (past and future)
                $meetings = $scheduleItems
                    ->where('course_id', $course->id)
                    ->map(fn (StudentMeetingSchedule $schedule) => [
                        'id' => $schedule->id,
                        'course_id' => $schedule->course_id,
                        'lesson_id' => $schedule->lesson_id,
                        'title' => $schedule->title,
                        'due_date' => $schedule->scheduled_at?->format('Y-m-d'),
                        'time' => $schedule->scheduled_at?->format('H:i'),
                        'completed' => $schedule->status === 'completed'
                            || $schedule->scheduled_at?->isPast(),
                        'course_title' => $schedule->course?->title,
                        'type' => 'meeting',
                        'meeting_url' => $schedule->meeting_url,
                        'category' => 'meeting',
                    ]);

                $calendarItems = $calendarItems->merge($meetings->all());

                // Add assessments (past and future)
                $assessments = $course->assessments
                    ->filter(fn (Assessment $assessment) => $assessment->due_date !== null && $assessment->is_published)
                    ->filter(fn (Assessment $assessment) => $assessment->due_date->between($start, $end))
                    ->map(fn (Assessment $assessment) => [
                        'id' => $assessment->id,
                        'course_id' => $course->id,
                        'lesson_id' => $assessment->lesson_id,
                        'title' => $assessment->title,
                        'due_date' => $assessment->due_date->format('Y-m-d'),
                        'time' => $assessment->due_date->format('H:i'),
                        'completed' => $assessment->due_date->isPast(),
                        'course_title' => $course->title,
                        'type' => $assessment->type,
                        'meeting_url' => null,
                        'category' => 'assessment',
                    ]);

                $calendarItems = $calendarItems->merge($assessments);
            }

            if ($isAdmin) {
                $courseMarkers = $scheduleItems
                    ->map(fn (StudentMeetingSchedule $schedule) => $schedule->scheduled_at?->toDateString())
                    ->merge($courses->flatMap(fn (Course $course) => $course->assessments
                        ->filter(fn (Assessment $assessment) => $assessment->due_date !== null && $assessment->is_published)
                        ->filter(fn (Assessment $assessment) => $assessment->due_date->between($start, $end))
                        ->map(fn (Assessment $assessment) => $assessment->due_date->toDateString())))
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();

                $paginatedCourses = Course::query()
                    ->with('instructor')
                    ->withCount('enrollments')
                    ->latest()
                    ->paginate(12)
                    ->withQueryString();

                $nextMeetingByCourse = StudentMeetingSchedule::query()
                    ->whereIn('course_id', $paginatedCourses->getCollection()->pluck('id'))
                    ->where('status', 'scheduled')
                    ->where('scheduled_at', '>=', now())
                    ->orderBy('scheduled_at')
                    ->get()
                    ->groupBy('course_id');

                $paginatedCourses = $paginatedCourses->through(function (Course $course) use ($nextMeetingByCourse) {
                    $nextMeeting = $nextMeetingByCourse->get($course->id)?->first();

                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'thumbnail' => $course->thumbnail,
                        'instructor' => $course->instructor ? [
                            'id' => $course->instructor->id,
                            'name' => $course->instructor->name,
                        ] : null,
                        'student_count' => $course->enrollments_count ?? 0,
                        'next_meeting_date' => $nextMeeting?->scheduled_at?->toDateString(),
                        'next_meeting_time' => $nextMeeting?->scheduled_at?->format('H:i'),
                        'is_published' => $course->is_published,
                    ];
                });
            }
        } else {
            // Student: Get enrolled courses
            $enrollments = $user->enrollments()
                ->with(['course.assessments'])
                ->where('status', 'active')
                ->get();

            $courseIds = $enrollments->pluck('course_id')->values();
            $meetingSchedules = StudentMeetingSchedule::query()
                ->with('course')
                ->where('student_id', $user->id)
                ->whereIn('course_id', $courseIds)
                ->where('status', '!=', 'cancelled')
                ->whereBetween('scheduled_at', [$start, $end])
                ->get();

            $meetings = $meetingSchedules->map(fn (StudentMeetingSchedule $schedule) => [
                'id' => $schedule->id,
                'course_id' => $schedule->course_id,
                'lesson_id' => $schedule->lesson_id,
                'title' => $schedule->title,
                'due_date' => $schedule->scheduled_at?->format('Y-m-d'),
                'time' => $schedule->scheduled_at?->format('H:i'),
                'completed' => $schedule->status === 'completed'
                    || $schedule->scheduled_at?->isPast(),
                'course_title' => $schedule->course?->title,
                'type' => 'meeting',
                'meeting_url' => $schedule->meeting_url,
                'category' => 'meeting',
            ]);

            $calendarItems = $calendarItems->merge($meetings->all());

            foreach ($enrollments as $enrollment) {
                $course = $enrollment->course;

                // Add assessments (past and future)
                $assessments = $course->assessments
                    ->filter(fn (Assessment $assessment) => $assessment->due_date !== null && $assessment->is_published)
                    ->filter(fn (Assessment $assessment) => $assessment->due_date->between($start, $end))
                    ->map(fn (Assessment $assessment) => [
                        'id' => $assessment->id,
                        'course_id' => $course->id,
                        'lesson_id' => $assessment->lesson_id,
                        'title' => $assessment->title,
                        'due_date' => $assessment->due_date->format('Y-m-d'),
                        'time' => $assessment->due_date->format('H:i'),
                        'completed' => $assessment->due_date->isPast(),
                        'course_title' => $course->title,
                        'type' => $assessment->type,
                        'meeting_url' => null,
                        'category' => 'assessment',
                    ]);

                $calendarItems = $calendarItems->merge($assessments);
            }

            // Also add daily tasks for students
            $tasks = $user->dailyTasks()
                ->with('lesson.course')
                ->whereBetween('due_date', [$start, $end])
                ->get()
                ->map(fn ($task) => [
                    'id' => $task->id,
                    'course_id' => $task->lesson?->course_id,
                    'lesson_id' => $task->lesson_id,
                    'title' => $task->title,
                    'due_date' => $task->due_date->format('Y-m-d'),
                    'time' => null,
                    'completed' => (bool) $task->is_completed,
                    'xp_reward' => $task->xp_reward,
                    'course_title' => $task->lesson?->course?->title ?? 'General',
                    'type' => 'task',
                    'meeting_url' => null,
                    'category' => 'task',
                ]);

            $calendarItems = $calendarItems->merge($tasks);
        }

        // Group by date
        $tasksByDate = $calendarItems
            ->groupBy('due_date')
            ->map(fn ($items) => $items->values()->all())
            ->all();

        // Compute stats
        $meetingsCount = $calendarItems->where('category', 'meeting')->count();
        $assessmentsCount = $calendarItems->where('category', 'assessment')->count();
        $completedCount = $calendarItems->where('completed', true)->count();
        $overdueCount = $calendarItems->filter(fn ($item) => ! $item['completed'] && Carbon::parse($item['due_date'])->isPast())->count();

        $payload = [
            'tasksByDate' => $tasksByDate,
            'stats' => [
                'total' => $calendarItems->count(),
                'completed' => $completedCount,
                'overdue' => $overdueCount,
                'meetings' => $meetingsCount,
                'assessments' => $assessmentsCount,
            ],
            'currentDate' => $date->format('Y-m-d'),
        ];

        if ($isAdmin) {
            $payload['courses'] = $paginatedCourses;
            $payload['courseMarkers'] = $courseMarkers;
        }

        return Inertia::render('calendar/index', $payload);
    }
}
