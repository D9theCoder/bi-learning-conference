<?php

namespace App\Http\Controllers;

use App\Models\AssessmentAttempt;
use App\Models\Attendance;
use App\Models\Course;
use App\Models\CourseContentCompletion;
use App\Models\Enrollment;
use App\Models\Reward;
use App\Models\StudentMeetingSchedule;
use App\Models\User;
use App\Services\AchievementProgressService;
use App\Services\GamificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected GamificationService $gamificationService,
        protected AchievementProgressService $achievementService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isTutor = $user->hasRole('tutor');
        $isAdmin = $user->hasRole('admin');
        $hasGamification = $user->hasGamification();

        // Get level progress data
        $levelProgress = $hasGamification
            ? $this->gamificationService->getLevelProgress($user)
            : ['xp_in_level' => 0, 'xp_for_next_level' => 0, 'progress_percentage' => 0];

        // Get achievements with progress for dashboard
        $dashboardAchievements = $hasGamification
            ? $this->achievementService->getDashboardAchievements($user)
            : ['recent' => collect(), 'in_progress' => collect()];

        // Merge recent earned achievements with in-progress for display
        $recentAchievements = $dashboardAchievements['recent']->merge($dashboardAchievements['in_progress'])->take(4);

        // Get next milestone (first unearned achievement with most progress)
        $nextMilestone = $dashboardAchievements['in_progress']->first();

        // Get enrolled courses with relationships and compute next_lesson per enrollment
        // Returns arrays preserving nested `course` while adding computed `next_lesson`
        $enrolledCourses = $hasGamification
            ? $user->enrollments()
                ->with(['course.lessons', 'course.instructor', 'course.assessments'])
                ->where('status', 'active')
                ->latest('last_activity_at')
                ->get()
                ->map(function ($enrollment) use ($user) {
                    $data = $enrollment->toArray();
                    $nextLesson = $user->nextLessonForEnrollment($enrollment);
                    $data['next_lesson'] = $nextLesson ? $nextLesson->toArray() : null;
                    // Ensure numeric type on progress_percentage for frontend typings
                    $data['progress_percentage'] = (float) ($enrollment->progress_percentage ?? 0);

                    return $data;
                })
            : collect();

        // Build student calendar with upcoming meetings and assessments from enrolled courses
        $studentCalendar = [];

        if ($hasGamification) {
            $activeEnrollments = $user->enrollments()
                ->with(['course.assessments'])
                ->where('status', 'active')
                ->get();

            $activeCourseIds = $activeEnrollments->pluck('course_id')->values();

            $upcomingMeetings = StudentMeetingSchedule::query()
                ->with('course')
                ->where('student_id', $user->id)
                ->whereIn('course_id', $activeCourseIds)
                ->where('status', 'scheduled')
                ->where('scheduled_at', '>=', now())
                ->orderBy('scheduled_at')
                ->get()
                ->map(fn ($schedule) => [
                    'id' => $schedule->id,
                    'course_id' => $schedule->course_id,
                    'lesson_id' => $schedule->lesson_id,
                    'title' => $schedule->title,
                    'course_title' => $schedule->course?->title,
                    'date' => $schedule->scheduled_at?->toDateString(),
                    'time' => $schedule->scheduled_at?->format('H:i'),
                    'type' => 'meeting',
                    'meeting_url' => $schedule->meeting_url,
                    'category' => 'meeting',
                ]);

            $studentCalendar = array_merge($studentCalendar, $upcomingMeetings->all());

            foreach ($activeEnrollments as $enrollment) {
                $course = $enrollment->course;

                // Add upcoming assessment due dates
                $upcomingAssessments = $course->assessments
                    ->filter(fn ($assessment) => $assessment->due_date !== null && $assessment->due_date->isFuture() && $assessment->is_published)
                    ->map(fn ($assessment) => [
                        'id' => $assessment->id,
                        'course_id' => $course->id,
                        'lesson_id' => $assessment->lesson_id,
                        'title' => $assessment->title,
                        'course_title' => $course->title,
                        'date' => $assessment->due_date?->toDateString(),
                        'time' => $assessment->due_date?->format('H:i'),
                        'type' => $assessment->type,
                        'meeting_url' => null,
                        'category' => 'assessment',
                    ]);

                $studentCalendar = array_merge($studentCalendar, $upcomingAssessments->all());
            }

            // Sort by date and limit to 8 items
            usort($studentCalendar, fn ($a, $b) => strcmp($a['date'], $b['date']));
            $studentCalendar = array_slice($studentCalendar, 0, 8);
        }

        // Get today's tasks (using configured timezone with reset time logic)
        $taskToday = app(\App\Services\DailyTaskGeneratorService::class)->getTaskDate()->toDateString();
        $todayTasks = $hasGamification
            ? $user->dailyTasks()
                ->with('lesson')
                ->whereDate('due_date', $taskToday)
                ->orderBy('is_completed')
                ->orderBy('estimated_minutes')
                ->get()
            : collect();

        // Get tutor messages
        $tutorMessages = $user->tutorMessages()
            ->with('tutor')
            ->where('is_read', false)
            ->latest('sent_at')
            ->limit(5)
            ->get();

        // Get recent activity
        $recentActivity = $hasGamification
            ? $user->activities()
                ->latest()
                ->limit(10)
                ->get()
            : collect();

        // Get global leaderboard
        $globalLeaderboard = $hasGamification
            ? User::query()
                ->orderByDesc('total_xp')
                ->limit(10)
                ->get()
                ->map(function ($u, $index) use ($user) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'avatar' => $u->avatar,
                        'xp' => $u->total_xp,
                        'level' => $u->level ?? 1,
                        'rank' => $index + 1,
                        'isCurrentUser' => $u->id === $user->id,
                    ];
                })
            : collect();

        $userTotalXp = $hasGamification ? ($user->total_xp ?? 0) : 0;
        $currentUserRank = $hasGamification
            ? User::where('total_xp', '>', $userTotalXp)->count() + 1
            : null;

        $tutorData = null;

        if ($isTutor) {
            $taughtCourses = Course::with([
                'lessons.contents',
                'enrollments.user',
                'assessments',
            ])
                ->where('instructor_id', $user->id)
                ->get();

            $courseIds = $taughtCourses->pluck('id');
            $contentIds = $taughtCourses
                ->flatMap(fn (Course $course) => $course->lessons->flatMap(fn ($lesson) => $lesson->contents))
                ->pluck('id');

            $completions = CourseContentCompletion::whereIn('course_content_id', $contentIds)
                ->get()
                ->groupBy('course_content_id');

            $lessonIds = $taughtCourses->flatMap(fn (Course $course) => $course->lessons->pluck('id'));
            $attendanceRecords = Attendance::whereIn('lesson_id', $lessonIds)->get();

            $assessmentIds = $taughtCourses->flatMap(fn (Course $course) => $course->assessments->pluck('id'));
            $completedAssessmentAttempts = AssessmentAttempt::whereIn('assessment_id', $assessmentIds)
                ->whereNotNull('completed_at')
                ->get();

            $upcomingSchedules = StudentMeetingSchedule::query()
                ->with('course')
                ->whereIn('course_id', $courseIds)
                ->where('status', 'scheduled')
                ->where('scheduled_at', '>=', now())
                ->orderBy('scheduled_at')
                ->get();
            $upcomingSchedulesByCourse = $upcomingSchedules->groupBy('course_id');

            $courseSnapshots = [];
            $chartSeries = [];
            $upcomingItems = $upcomingSchedules
                ->map(fn ($schedule) => [
                    'id' => $schedule->id,
                    'course_id' => $schedule->course_id,
                    'lesson_id' => $schedule->lesson_id,
                    'title' => $schedule->title,
                    'course_title' => $schedule->course?->title,
                    'due_date' => $schedule->scheduled_at?->toDateString(),
                    'time' => $schedule->scheduled_at?->format('H:i'),
                    'type' => 'meeting',
                    'meeting_url' => $schedule->meeting_url,
                    'category' => 'meeting',
                ])
                ->all();
            $studentAggregates = [];

            foreach ($taughtCourses as $course) {
                $enrollments = $course->enrollments;
                $studentCount = $enrollments->count();
                $activeStudents = $enrollments->where('status', 'active')->count();
                $avgProgress = round((float) ($enrollments->avg('progress_percentage') ?? 0), 1);

                $courseLessonIds = $course->lessons->pluck('id');
                $lessonCount = $courseLessonIds->count();

                $attendanceCount = $attendanceRecords
                    ->whereIn('lesson_id', $courseLessonIds)
                    ->count();

                $attendancePossible = max(1, $lessonCount * max(1, $studentCount));
                $attendanceRate = round(($attendanceCount / $attendancePossible) * 100, 1);

                $courseAssessmentIds = $course->assessments->pluck('id');
                $assessmentCount = $courseAssessmentIds->count();

                $quizCompletedCount = $completedAssessmentAttempts
                    ->whereIn('assessment_id', $courseAssessmentIds)
                    ->unique(fn ($attempt) => $attempt->user_id.'-'.$attempt->assessment_id)
                    ->count();

                $quizPossible = max(1, $assessmentCount * max(1, $studentCount));
                $quizRate = round(($quizCompletedCount / $quizPossible) * 100, 1);

                $nextMeeting = $upcomingSchedulesByCourse->get($course->id)?->first();

                $courseSnapshots[] = [
                    'id' => $course->id,
                    'title' => $course->title,
                    'thumbnail' => $course->thumbnail,
                    'student_count' => $studentCount,
                    'active_students' => $activeStudents,
                    'next_meeting_date' => $nextMeeting?->scheduled_at?->toDateString(),
                    'next_meeting_time' => $nextMeeting?->scheduled_at?->format('H:i'),
                    'is_published' => $course->is_published,
                ];

                $chartSeries[] = [
                    'course' => $course->title,
                    'attendance' => $attendanceRate,
                    'quiz' => $quizRate,
                    'students' => $studentCount,
                ];

                // Add upcoming assessment due dates
                $upcomingAssessments = $course->assessments
                    ->filter(fn ($assessment) => $assessment->due_date !== null && $assessment->due_date->isFuture() && $assessment->is_published)
                    ->sortBy('due_date')
                    ->map(fn ($assessment) => [
                        'id' => $assessment->id,
                        'course_id' => $course->id,
                        'lesson_id' => $assessment->lesson_id,
                        'title' => $assessment->title,
                        'course_title' => $course->title,
                        'due_date' => $assessment->due_date?->toDateString(),
                        'time' => $assessment->due_date?->format('H:i'),
                        'type' => $assessment->type,
                        'meeting_url' => null,
                        'category' => 'assessment',
                    ]);

                $upcomingItems = array_merge($upcomingItems, $upcomingAssessments->all());

                foreach ($enrollments as $enrollment) {
                    $student = $enrollment->user;

                    if (! $student) {
                        continue;
                    }

                    if (! isset($studentAggregates[$student->id])) {
                        $studentAggregates[$student->id] = [
                            'id' => $student->id,
                            'name' => $student->name,
                            'avatar' => $student->avatar,
                            'courses' => 0,
                            'progress_values' => [],
                        ];
                    }

                    $studentAggregates[$student->id]['courses']++;
                    $studentAggregates[$student->id]['progress_values'][] = (float) ($enrollment->progress_percentage ?? 0);
                }
            }

            usort($upcomingItems, fn ($a, $b) => strcmp($a['due_date'], $b['due_date']));
            $upcomingItems = array_slice($upcomingItems, 0, 8);

            $roster = collect($studentAggregates)
                ->map(function ($entry) {
                    $avg = count($entry['progress_values']) > 0
                        ? round(array_sum($entry['progress_values']) / count($entry['progress_values']), 1)
                        : 0;

                    return [
                        'id' => $entry['id'],
                        'name' => $entry['name'],
                        'avatar' => $entry['avatar'],
                        'courses' => $entry['courses'],
                        'average_progress' => $avg,
                    ];
                })
                ->sortByDesc('average_progress')
                ->values()
                ->take(10)
                ->all();

            $tutorData = [
                'courses' => $courseSnapshots,
                'chart' => $chartSeries,
                'calendar' => $upcomingItems,
                'roster' => $roster,
                'summary' => [
                    'course_count' => $courseSnapshots ? count($courseSnapshots) : 0,
                    'student_count' => collect($courseSnapshots)->sum('student_count'),
                    'average_progress' => round(
                        collect($courseSnapshots)->avg('average_progress') ?? 0,
                        1
                    ),
                ],
            ];
        }

        $adminData = null;

        if ($isAdmin) {
            $tutors = User::role('tutor')
                ->select(['id', 'name', 'avatar'])
                ->orderBy('name')
                ->get();

            $courseCounts = Course::query()
                ->select('instructor_id', DB::raw('count(*) as course_count'))
                ->whereNotNull('instructor_id')
                ->groupBy('instructor_id')
                ->pluck('course_count', 'instructor_id');

            $studentCounts = Enrollment::query()
                ->select('courses.instructor_id', DB::raw('count(distinct enrollments.user_id) as student_count'))
                ->join('courses', 'courses.id', '=', 'enrollments.course_id')
                ->whereNotNull('courses.instructor_id')
                ->groupBy('courses.instructor_id')
                ->pluck('student_count', 'courses.instructor_id');

            $allTutors = $tutors->map(function (User $tutor) use ($courseCounts, $studentCounts) {
                return [
                    'id' => $tutor->id,
                    'name' => $tutor->name,
                    'avatar' => $tutor->avatar,
                    'course_count' => (int) ($courseCounts[$tutor->id] ?? 0),
                    'student_count' => (int) ($studentCounts[$tutor->id] ?? 0),
                ];
            });

            $allCourses = Course::with('instructor')
                ->withCount('enrollments')
                ->latest()
                ->get()
                ->map(function (Course $course) {
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'instructor' => $course->instructor ? [
                            'id' => $course->instructor->id,
                            'name' => $course->instructor->name,
                        ] : null,
                        'student_count' => $course->enrollments_count,
                        'is_published' => $course->is_published,
                    ];
                });

            $allStudents = User::role('student')
                ->withCount('enrollments')
                ->orderByDesc('total_xp')
                ->limit(20)
                ->get()
                ->map(function (User $student) {
                    return [
                        'id' => $student->id,
                        'name' => $student->name,
                        'avatar' => $student->avatar,
                        'enrollment_count' => $student->enrollments_count,
                        'total_xp' => $student->total_xp ?? 0,
                        'level' => $student->level ?? 1,
                    ];
                });

            $adminData = [
                'tutors' => $allTutors,
                'courses' => $allCourses,
                'students' => $allStudents,
                'summary' => [
                    'tutor_count' => $tutors->count(),
                    'course_count' => Course::count(),
                    'student_count' => User::role('student')->count(),
                    'active_enrollment_count' => Enrollment::where('status', 'active')->count(),
                ],
            ];
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'streak' => $hasGamification ? $user->currentStreak() : 0,
                'longest_streak' => $hasGamification ? ($user->longest_streak ?? 0) : 0,
                'xp_this_week' => $hasGamification ? $user->xpThisWeek() : 0,
                'hours_learned' => $hasGamification ? $user->hoursThisWeek() : 0,
                'active_courses' => $hasGamification ? $user->enrollments()->where('status', 'active')->count() : 0,
                'total_xp' => $hasGamification ? ($user->total_xp ?? 0) : 0,
                'level' => $hasGamification ? ($user->level ?? 1) : 1,
                'points_balance' => $hasGamification ? ($user->points_balance ?? 0) : 0,
                'xp_in_level' => $levelProgress['xp_in_level'],
                'xp_for_next_level' => $levelProgress['xp_for_next_level'],
                'level_progress_percentage' => $levelProgress['progress_percentage'],
            ],
            'today_tasks' => $todayTasks,
            'enrolled_courses' => $enrolledCourses,
            'student_calendar' => $studentCalendar,
            'recent_achievements' => $recentAchievements,
            'next_milestone' => $nextMilestone,
            'recent_activity' => $recentActivity,
            'tutor_messages' => $tutorMessages,
            'unread_message_count' => $user->tutorMessages()->where('is_read', false)->count(),
            'global_leaderboard' => $globalLeaderboard,
            'current_user_rank' => $currentUserRank,
            'weekly_activity_data' => $hasGamification
                ? collect($user->weeklyActivityChartData())->map(fn ($item) => [
                    'name' => $item['day'],
                    'value' => $item['xp'],
                ])->toArray()
                : [],
            'available_rewards' => $hasGamification
                ? Reward::where('is_active', true)
                    ->orderBy('cost')
                    ->limit(6)
                    ->get()
                : collect(),
            'tutor_dashboard' => $tutorData,
            'admin_dashboard' => $adminData,
            'is_admin' => $isAdmin,
        ]);
    }
}
