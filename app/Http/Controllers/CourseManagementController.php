<?php

namespace App\Http\Controllers;

use App\CourseCategory;
use App\Http\Requests\StoreCourseContentRequest;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\StoreLessonRequest;
use App\Http\Requests\UpdateCourseContentRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Requests\UpdateLessonRequest;
use App\Models\Assessment;
use App\Models\Course;
use App\Models\CourseContent;
use App\Models\Lesson;
use App\Models\Powerup;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Course::query()->with('instructor');

        if (! $user->hasRole('admin')) {
            $query->where('instructor_id', $user->id);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $courses = $query
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(function (Course $course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'category' => $course->category,
                    'difficulty' => $course->difficulty,
                    'is_published' => $course->is_published,
                    'updated_at' => $course->updated_at?->toIsoString(),
                    'instructor' => $course->instructor ? [
                        'id' => $course->instructor->id,
                        'name' => $course->instructor->name,
                    ] : null,
                ];
            });

        return Inertia::render('courses/manage/index', [
            'courses' => $courses,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasRole('admin')) {
            abort(403);
        }

        $availableTutors = User::role('tutor')
            ->orderBy('name')
            ->get(['id', 'name', 'avatar']);

        return Inertia::render('courses/manage/edit', [
            'course' => null,
            'mode' => 'create',
            'categories' => CourseCategory::options(),
            'availableTutors' => $availableTutors,
            'isAdmin' => $user->hasRole('admin'),
        ]);
    }

    public function store(StoreCourseRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $data['difficulty'] = $data['difficulty'] ?? 'beginner';
        $data['is_published'] = $request->boolean('is_published');

        $course = Course::create($data);

        return redirect()
            ->route('courses.manage.edit', $course)
            ->with('message', 'Course created.');
    }

    public function edit(Request $request, Course $course): Response
    {
        $user = $request->user();

        if ($user->hasRole('tutor') && ! $user->hasRole('admin') && $course->instructor_id !== $user->id) {
            abort(403);
        }

        $course->load(['lessons.contents.assessment', 'lessons.assessments']);

        $availablePowerups = Powerup::query()->orderBy('name')->get();
        $availableTutors = [];

        if ($user->hasRole('admin')) {
            $availableTutors = User::role('tutor')
                ->orderBy('name')
                ->get(['id', 'name', 'avatar']);
        }

        return Inertia::render('courses/manage/edit', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'description' => $course->description,
                'thumbnail' => $course->thumbnail,
                'duration_minutes' => $course->duration_minutes,
                'difficulty' => $course->difficulty,
                'category' => $course->category,
                'is_published' => $course->is_published,
                'instructor_id' => $course->instructor_id,
                'lessons' => $course->lessons->map(function (Lesson $lesson) {
                    return [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'description' => $lesson->description,
                        'duration_minutes' => $lesson->duration_minutes,
                        'order' => $lesson->order,
                        'video_url' => $lesson->video_url,
                        'contents' => $lesson->contents
                            ->where('type', '!=', 'assessment')
                            ->map(function (CourseContent $content) {
                                return [
                                    'id' => $content->id,
                                    'lesson_id' => $content->lesson_id,
                                    'title' => $content->title,
                                    'type' => $content->type,
                                    'file_path' => $content->file_path,
                                    'url' => $content->url,
                                    'description' => $content->description,
                                    'due_date' => $content->due_date?->toDateString(),
                                    'duration_minutes' => $content->duration_minutes,
                                    'is_required' => $content->is_required,
                                    'order' => $content->order,
                                    'weight_percentage' => $content->assessment?->weight_percentage,
                                    'created_at' => $content->created_at?->toIsoString(),
                                    'updated_at' => $content->updated_at?->toIsoString(),
                                ];
                            })->values(),
                        'assessments' => $lesson->assessments->map(function (Assessment $assessment) {
                            return [
                                'id' => $assessment->id,
                                'course_id' => $assessment->course_id,
                                'lesson_id' => $assessment->lesson_id,
                                'type' => $assessment->type,
                                'title' => $assessment->title,
                                'description' => $assessment->description,
                                'due_date' => $assessment->due_date?->toIsoString(),
                                'max_score' => $assessment->max_score,
                                'allow_retakes' => $assessment->allow_retakes,
                                'time_limit_minutes' => $assessment->time_limit_minutes,
                                'is_published' => $assessment->is_published,
                                'weight_percentage' => $assessment->weight_percentage,
                                'created_at' => $assessment->created_at?->toIsoString(),
                                'updated_at' => $assessment->updated_at?->toIsoString(),
                            ];
                        })->values(),
                        'created_at' => $lesson->created_at?->toIsoString(),
                        'updated_at' => $lesson->updated_at?->toIsoString(),
                    ];
                })->values(),
            ],
            'mode' => 'edit',
            'categories' => CourseCategory::options(),
            'availablePowerups' => $availablePowerups,
            'availableTutors' => $availableTutors,
            'isAdmin' => $user->hasRole('admin'),
        ]);
    }

    public function update(UpdateCourseRequest $request, Course $course): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if ($user->hasRole('admin')) {
            $data['instructor_id'] = $data['instructor_id'] ?? $course->instructor_id;
        } else {
            $data['instructor_id'] = $user->id;
        }

        $data['difficulty'] = $data['difficulty'] ?? $course->difficulty ?? 'beginner';
        $data['is_published'] = $request->boolean('is_published');

        $course->update($data);

        return redirect()
            ->route('courses.manage.edit', $course)
            ->with('message', 'Course updated.');
    }

    public function storeLesson(StoreLessonRequest $request, Course $course): RedirectResponse
    {
        $this->ensureCanManageCourse($request->user(), $course);

        $course->lessons()->create($request->validated());

        return redirect()
            ->route('courses.manage.edit', $course)
            ->with('message', 'Lesson created.');
    }

    public function updateLesson(UpdateLessonRequest $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureLessonBelongsToCourse($lesson, $course);
        $this->ensureCanManageCourse($request->user(), $course);

        $lesson->update($request->validated());

        return redirect()
            ->route('courses.manage.edit', $course)
            ->with('message', 'Lesson updated.');
    }

    public function destroyLesson(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureLessonBelongsToCourse($lesson, $course);
        $this->ensureCanManageCourse($request->user(), $course);

        $lesson->delete();

        return redirect()
            ->route('courses.manage.edit', $course)
            ->with('message', 'Lesson deleted.');
    }

    public function storeContent(StoreCourseContentRequest $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureLessonBelongsToCourse($lesson, $course);
        $this->ensureCanManageCourse($request->user(), $course);

        $data = $request->validated();

        if ($data['type'] === 'assessment') {
            $assessmentType = $data['assessment_type'] ?? 'quiz';
            $maxScore = in_array($assessmentType, ['practice', 'quiz'], true)
                ? 100
                : ($data['max_score'] ?? 100);
            $weightPercentage = $assessmentType === 'final_exam'
                ? ($data['weight_percentage'] ?? null)
                : null;

            $assessment = Assessment::create([
                'course_id' => $course->id,
                'lesson_id' => $lesson->id,
                'type' => $assessmentType,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'max_score' => $maxScore,
                'is_published' => false,
                'weight_percentage' => $weightPercentage,
            ]);

            if (
                ($data['allow_powerups'] ?? false)
                && $assessmentType !== 'final_exam'
                && ! empty($data['allowed_powerups'])
            ) {
                $powerupsToSync = collect($data['allowed_powerups'])->mapWithKeys(function ($powerup) {
                    return [$powerup['id'] => ['limit' => $powerup['limit']]];
                })->all();

                $assessment->powerups()->sync($powerupsToSync);
            }

            return redirect()
                ->route('courses.manage.edit', $course)
                ->with('message', 'Assessment created.');
        }

        // Handle file upload
        if ($request->hasFile('file_path')) {
            $file = $request->file('file_path');
            $path = $file->store('course-content', 'public');
            $data['file_path'] = $path;
        }

        $content = $lesson->contents()->create($data);

        return redirect()
            ->route('courses.manage.edit', $course)
            ->with('message', 'Content created.');
    }

    public function updateContent(UpdateCourseContentRequest $request, Course $course, Lesson $lesson, CourseContent $content): RedirectResponse
    {
        $this->ensureLessonBelongsToCourse($lesson, $course);
        $this->ensureContentBelongsToLesson($content, $lesson);
        $this->ensureCanManageCourse($request->user(), $course);

        $data = $request->validated();

        // Handle file upload
        if ($request->hasFile('file_path')) {
            // Delete old file if exists
            if ($content->file_path && \Storage::disk('public')->exists($content->file_path)) {
                \Storage::disk('public')->delete($content->file_path);
            }

            $file = $request->file('file_path');
            $path = $file->store('course-content', 'public');
            $data['file_path'] = $path;
        } else {
            // Keep existing file path if no new file uploaded
            unset($data['file_path']);
        }

        $originalTitle = $content->title;
        $content->update($data);

        // Sync Assessment if type is assessment
        if ($content->type === 'assessment') {
            $assessment = $content->assessment;
            $assessmentType = $content->assessment_type ?? 'quiz';
            $maxScore = in_array($assessmentType, ['practice', 'quiz'], true)
                ? 100
                : ($content->max_score ?? 100);
            $weightPercentage = $assessmentType === 'final_exam'
                ? ($data['weight_percentage'] ?? $assessment?->weight_percentage)
                : null;

            // If assessment doesn't exist, create it
            if (! $assessment) {
                $assessment = Assessment::create([
                    'course_id' => $course->id,
                    'lesson_id' => $lesson->id,
                    'type' => $assessmentType,
                    'title' => $content->title,
                    'description' => $content->description,
                    'due_date' => $content->due_date,
                    'max_score' => $maxScore,
                    'is_published' => false,
                    'weight_percentage' => $weightPercentage,
                ]);

                $content->update(['assessment_id' => $assessment->id]);
            } else {
                // Update existing assessment
                $assessment->update([
                    'type' => $assessmentType,
                    'title' => $content->title,
                    'description' => $content->description,
                    'due_date' => $content->due_date,
                    'max_score' => $maxScore,
                    'weight_percentage' => $weightPercentage,
                ]);
            }

            // Sync powerups
            if ($content->allow_powerups && $content->assessment_type !== 'final_exam' && ! empty($content->allowed_powerups)) {
                $powerupsToSync = collect($content->allowed_powerups)->mapWithKeys(function ($powerup) {
                    return [$powerup['id'] => ['limit' => $powerup['limit']]];
                })->all();

                $assessment->powerups()->sync($powerupsToSync);
            } else {
                // Remove all powerups if not allowed
                $assessment->powerups()->sync([]);
            }
        }

        return redirect()
            ->route('courses.manage.edit', $course)
            ->with('message', 'Content updated.');
    }

    public function destroyContent(Request $request, Course $course, Lesson $lesson, CourseContent $content): RedirectResponse
    {
        $this->ensureLessonBelongsToCourse($lesson, $course);
        $this->ensureContentBelongsToLesson($content, $lesson);
        $this->ensureCanManageCourse($request->user(), $course);

        if ($content->type === 'quiz') {
            Assessment::where('lesson_id', $lesson->id)
                ->where('title', $content->title)
                ->delete();
        }

        $content->delete();

        return redirect()
            ->route('courses.manage.edit', $course)
            ->with('message', 'Content deleted.');
    }

    private function ensureCanManageCourse(?User $user, Course $course): void
    {
        if (! $user) {
            abort(403);
        }

        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->hasRole('tutor') && $course->instructor_id === $user->id) {
            return;
        }

        abort(403);
    }

    private function ensureLessonBelongsToCourse(Lesson $lesson, Course $course): void
    {
        if ($lesson->course_id !== $course->id) {
            abort(403);
        }
    }

    private function ensureContentBelongsToLesson(CourseContent $content, Lesson $lesson): void
    {
        if ($content->lesson_id !== $lesson->id) {
            abort(403);
        }
    }
}
