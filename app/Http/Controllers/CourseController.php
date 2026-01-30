<?php

namespace App\Http\Controllers;

use App\Http\Requests\FilterCoursesRequest;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentSubmission;
use App\Models\Attendance;
use App\Models\Course;
use App\Models\FinalScore;
use App\Models\Lesson;
use App\Models\StudentMeetingSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(FilterCoursesRequest $request): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        // Redirect tutors to manage courses page
        if ($user->hasRole('tutor') && ! $user->hasRole('admin')) {
            return redirect()->route('courses.manage.index');
        }

        $enrolledCourses = collect();
        $enrolledCourseIds = [];

        // Get validated filters
        $filters = $request->validated();

        // Build query with eager loading
        $query = Course::query()
            ->with(['instructor'])
            ->withCount(['lessons', 'enrollments']);

        // Apply filters
        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['difficulty'])) {
            $query->where('difficulty', $filters['difficulty']);
        }

        // Apply sorting
        $sort = $filters['sort'] ?? 'latest';
        match ($sort) {
            'popular' => $query->orderByDesc('enrollments_count'),
            'latest' => $query->latest(),
            'progress' => $query->orderByDesc('updated_at'),
            default => $query->latest(),
        };

        // Paginate
        if ($user->hasRole('tutor') && ! $user->hasRole('admin')) {
            $query->where('instructor_id', $user->id);
        } elseif (! $user->hasAnyRole(['admin', 'tutor'])) {
            // Students can only see published courses
            $query->where('is_published', true);

            $enrolledCourseIds = $user->enrollments()
                ->pluck('course_id')
                ->values()
                ->all();

            if (count($enrolledCourseIds) > 0) {
                $query->whereNotIn('id', $enrolledCourseIds);
            }

            $activeEnrollments = $user->enrollments()
                ->active()
                ->with([
                    'course' => function ($q) {
                        $q->with(['instructor'])
                            ->withCount(['lessons', 'enrollments']);
                    },
                ])
                ->orderByDesc('last_activity_at')
                ->orderByDesc('updated_at')
                ->get();

            $enrolledCourses = $activeEnrollments
                ->map(function ($enrollment) use ($user) {
                    $course = $enrollment->course;

                    if (! $course) {
                        return null;
                    }

                    $courseData = $course->toArray();
                    $courseData['user_progress'] = [
                        'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
                        'next_lesson' => $user->nextLessonForEnrollment($enrollment)?->toArray(),
                    ];

                    return $courseData;
                })
                ->filter()
                ->values();
        }

        $courses = $query->paginate(12)->withQueryString();

        // Get user enrollments to compute progress
        $enrollments = $user->enrollments()
            ->with('course.lessons')
            ->get()
            ->keyBy('course_id');

        // Add user progress to courses
        $courses = $courses->through(function ($course) use ($enrollments, $user) {
            $courseData = $course->toArray();

            if ($enrollments->has($course->id)) {
                $enrollment = $enrollments[$course->id];
                $courseData['user_progress'] = [
                    'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
                    'next_lesson' => $user->nextLessonForEnrollment($enrollment)?->toArray(),
                ];
            }

            return $courseData;
        });

        return Inertia::render('courses/index', [
            'filters' => $filters,
            'courses' => $courses,
            'enrolled_courses' => $enrolledCourses,
        ]);
    }

    public function show(Course $course): Response
    {
        $course->load(['instructor', 'lessons.contents']);

        $user = auth()->user();
        $isAdmin = $user?->hasRole('admin') ?? false;
        $hasTutorRole = $user?->hasRole('tutor') ?? false;
        $isInstructor = $user && $course->instructor_id === $user->id;
        $isTutor = $isAdmin || ($hasTutorRole && $isInstructor) || $isInstructor;

        if ($user && $hasTutorRole && ! $isAdmin && ! $isInstructor) {
            abort(403);
        }

        $isEnrolled = false;
        $students = [];
        $assessments = [];
        $submissions = [];
        $meetingSchedules = [];

        $formatSchedule = static function (StudentMeetingSchedule $schedule): array {
            return [
                'id' => $schedule->id,
                'course_id' => $schedule->course_id,
                'lesson_id' => $schedule->lesson_id,
                'student_id' => $schedule->student_id,
                'title' => $schedule->title,
                'meeting_url' => $schedule->meeting_url,
                'scheduled_at' => $schedule->scheduled_at?->toIsoString(),
                'duration_minutes' => $schedule->duration_minutes,
                'notes' => $schedule->notes,
                'status' => $schedule->status,
                'created_at' => $schedule->created_at?->toIsoString(),
                'updated_at' => $schedule->updated_at?->toIsoString(),
            ];
        };

        if ($user) {
            if (! $isInstructor) {
                $isEnrolled = $user->enrollments()->where('course_id', $course->id)->exists();
            }

            if ($isTutor) {
                // Fetch enrolled students with attendance
                $students = \App\Models\Enrollment::where('course_id', $course->id)
                    ->with(['user', 'user.attendances' => function ($q) use ($course) {
                        $q->whereIn('lesson_id', $course->lessons->pluck('id'));
                    }])
                    ->get()
                    ->map(function ($enrollment) use ($course) {
                        $userData = $enrollment->user->toArray();
                        $userData['enrollment_status'] = $enrollment->status;
                        $userData['attendances'] = $enrollment->user->attendances;
                        // Add submissions
                        $userData['submissions'] = AssessmentSubmission::whereHas('assessment', function ($q) use ($course) {
                            $q->where('course_id', $course->id);
                        })->where('user_id', $enrollment->user->id)->get();

                        return $userData;
                    });

                $assessments = Assessment::where('course_id', $course->id)
                    ->with(['submissions.user', 'questions'])
                    ->get();

                $assessmentIdsWithAttempts = $assessments
                    ->whereIn('type', ['practice', 'quiz', 'final_exam'])
                    ->pluck('id')
                    ->values();

                if ($assessmentIdsWithAttempts->isNotEmpty() && $students instanceof \Illuminate\Support\Collection && $students->isNotEmpty()) {
                    $studentIds = $students->pluck('id')->values();

                    $formatAttempt = function (AssessmentAttempt $attempt): array {
                        return [
                            'id' => $attempt->id,
                            'assessment_id' => $attempt->assessment_id,
                            'user_id' => $attempt->user_id,
                            'answers' => $attempt->answers,
                            'score' => $attempt->score,
                            'total_points' => $attempt->total_points,
                            'started_at' => $attempt->started_at?->toIsoString(),
                            'completed_at' => $attempt->completed_at?->toIsoString(),
                            'is_graded' => (bool) $attempt->is_graded,
                            'is_remedial' => (bool) $attempt->is_remedial,
                            'points_awarded' => (int) $attempt->points_awarded,
                            'created_at' => $attempt->created_at?->toIsoString(),
                            'updated_at' => $attempt->updated_at?->toIsoString(),
                        ];
                    };

                    $attemptsByStudent = AssessmentAttempt::query()
                        ->whereIn('assessment_id', $assessmentIdsWithAttempts)
                        ->whereIn('user_id', $studentIds)
                        ->orderByDesc('completed_at')
                        ->orderByDesc('created_at')
                        ->get()
                        ->groupBy('user_id');

                    $students = $students->map(function (array $student) use ($attemptsByStudent, $formatAttempt) {
                        $studentId = $student['id'] ?? null;

                        if (! $studentId) {
                            $student['assessment_attempts'] = [];

                            return $student;
                        }

                        $attempts = $attemptsByStudent->get($studentId, collect());

                        $student['assessment_attempts'] = $attempts
                            ->map(fn (AssessmentAttempt $attempt) => $formatAttempt($attempt))
                            ->values();

                        return $student;
                    });
                }

                if ($students instanceof \Illuminate\Support\Collection && $students->isNotEmpty()) {
                    $finalScores = FinalScore::query()
                        ->where('course_id', $course->id)
                        ->get()
                        ->keyBy('user_id');

                    $students = $students->map(function (array $student) use ($finalScores) {
                        $finalScore = $finalScores->get($student['id'] ?? null);
                        $student['final_score'] = $finalScore?->toArray();

                        return $student;
                    });
                }

                $meetingSchedulesByStudent = StudentMeetingSchedule::query()
                    ->where('course_id', $course->id)
                    ->orderBy('scheduled_at')
                    ->get()
                    ->groupBy('student_id');

                $meetingSchedules = $meetingSchedulesByStudent
                    ->flatten(1)
                    ->map(fn (StudentMeetingSchedule $schedule) => $formatSchedule($schedule))
                    ->values();

                $students = $students->map(function (array $student) use ($meetingSchedulesByStudent, $formatSchedule) {
                    $studentId = $student['id'] ?? null;

                    if (! $studentId) {
                        $student['meeting_schedules'] = [];

                        return $student;
                    }

                    $student['meeting_schedules'] = $meetingSchedulesByStudent
                        ->get($studentId, collect())
                        ->map(fn (StudentMeetingSchedule $schedule) => $formatSchedule($schedule))
                        ->values();

                    return $student;
                });
            } else {
                $attendedLessonIds = $user->attendances()
                    ->whereIn('lesson_id', $course->lessons->pluck('id'))
                    ->pluck('lesson_id')
                    ->toArray();

                $course->lessons->each(function ($lesson) use ($attendedLessonIds) {
                    $lesson->has_attended = in_array($lesson->id, $attendedLessonIds);
                });

                if ($isEnrolled) {
                    $assessments = Assessment::where('course_id', $course->id)
                        ->with('questions')
                        ->get();
                    $submissions = AssessmentSubmission::whereIn('assessment_id', $assessments->pluck('id'))
                        ->where('user_id', $user->id)
                        ->get();

                    $attemptsByAssessment = AssessmentAttempt::query()
                        ->whereIn('assessment_id', $assessments->pluck('id'))
                        ->where('user_id', $user->id)
                        ->whereNotNull('completed_at')
                        ->orderByDesc('completed_at')
                        ->orderByDesc('created_at')
                        ->get()
                        ->groupBy('assessment_id');

                    $assessmentsById = $assessments->keyBy('id');

                    $formatAttempt = function (AssessmentAttempt $attempt): array {
                        return [
                            'id' => $attempt->id,
                            'assessment_id' => $attempt->assessment_id,
                            'user_id' => $attempt->user_id,
                            'answers' => $attempt->answers,
                            'score' => $attempt->score,
                            'total_points' => $attempt->total_points,
                            'started_at' => $attempt->started_at?->toIsoString(),
                            'completed_at' => $attempt->completed_at?->toIsoString(),
                            'is_graded' => (bool) $attempt->is_graded,
                            'is_remedial' => (bool) $attempt->is_remedial,
                            'points_awarded' => (int) $attempt->points_awarded,
                            'created_at' => $attempt->created_at?->toIsoString(),
                            'updated_at' => $attempt->updated_at?->toIsoString(),
                        ];
                    };

                    $submissions = $submissions->map(function (AssessmentSubmission $submission) use ($assessmentsById, $attemptsByAssessment, $formatAttempt) {
                        $assessment = $assessmentsById->get($submission->assessment_id);
                        $attemptCandidates = $attemptsByAssessment->get($submission->assessment_id, collect());
                        $attempt = null;

                        if ($assessment) {
                            if ($assessment->allow_retakes) {
                                $attempt = $attemptCandidates
                                    ->sortByDesc(fn (AssessmentAttempt $candidate) => $candidate->score ?? -1)
                                    ->first();
                            } else {
                                $attempt = $attemptCandidates
                                    ->sortByDesc('completed_at')
                                    ->first();
                            }
                        }

                        return [
                            ...$submission->toArray(),
                            'attempt' => $attempt ? $formatAttempt($attempt) : null,
                        ];
                    });

                    $meetingSchedules = StudentMeetingSchedule::query()
                        ->where('course_id', $course->id)
                        ->where('student_id', $user->id)
                        ->orderBy('scheduled_at')
                        ->get()
                        ->map(fn (StudentMeetingSchedule $schedule) => $formatSchedule($schedule))
                        ->values();
                }
            }
        }

        return Inertia::render('courses/show', [
            'course' => $course,
            'isEnrolled' => $isEnrolled,
            'isTutor' => $isTutor,
            'students' => $students,
            'assessments' => $assessments,
            'submissions' => $submissions,
            'meetingSchedules' => $meetingSchedules,
        ]);
    }

    public function markAttendance(Lesson $lesson)
    {
        $user = auth()->user();

        if (! $user) {
            return back()->withErrors(['error' => 'Unauthorized']);
        }

        Attendance::updateOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'attended_at' => now(),
            ]
        );

        return back();
    }

    public function updateScore(Request $request, Assessment $assessment)
    {
        $user = auth()->user();
        if (! $user) {
            abort(401);
        }

        $course = $assessment->course;
        if (! $user->hasRole('admin') && $course->instructor_id !== $user->id) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'score' => 'required|integer|min:0|max:'.$assessment->max_score,
            'feedback' => 'nullable|string',
        ]);

        AssessmentSubmission::updateOrCreate(
            [
                'assessment_id' => $assessment->id,
                'user_id' => $validated['user_id'],
            ],
            [
                'score' => $validated['score'],
                'feedback' => $validated['feedback'],
                'submitted_at' => now(),
            ]
        );

        return back()->with('message', 'Score updated.');
    }
}
