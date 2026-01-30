<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssessmentQuestionRequest;
use App\Http\Requests\StoreQuizRequest;
use App\Http\Requests\UpdateAssessmentQuestionRequest;
use App\Http\Requests\UpdateQuizRequest;
use App\Http\Requests\UseQuizPowerupRequest;
use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\FinalScore;
use App\Models\Lesson;
use App\Models\Powerup;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    public function __construct(
        protected GamificationService $gamificationService
    ) {}

    /**
     * Calculate attempt score using a mix of:
     * - Manual per-question grades stored at "{questionId}_grade" in the answers payload
     * - Auto-grading for objective questions when no manual grade exists
     *
     * @param  array<string, mixed>  $answers
     * @return array{score:int, is_graded:bool}
     */
    protected function calculateAttemptScore(Assessment $assessment, array $answers): array
    {
        $questions = $assessment->questions()->get();

        $score = 0;
        $hasUngradedEssay = false;

        foreach ($questions as $question) {
            $gradeKey = $question->id.'_grade';

            if (array_key_exists($gradeKey, $answers)) {
                $awardedPoints = (int) $answers[$gradeKey];
                $awardedPoints = max(0, min($awardedPoints, (int) $question->points));
                $score += $awardedPoints;

                continue;
            }

            $answer = $answers[$question->id] ?? null;

            if ($question->type === 'essay') {
                $hasUngradedEssay = true;

                continue;
            }

            if ($answer === null || $answer === '') {
                continue;
            }

            if ($question->type === 'multiple_choice') {
                $config = $question->answer_config;
                $correctIndex = is_array($config) && ($config['type'] ?? null) === 'multiple_choice'
                    ? ($config['correct_index'] ?? -1)
                    : -1;

                if ((int) $answer === (int) $correctIndex) {
                    $score += (int) $question->points;
                }

                continue;
            }

            if ($question->type === 'fill_blank') {
                $normalizedAnswer = strtolower(trim((string) $answer));
                $config = $question->answer_config;
                $correctAnswers = is_array($config) && ($config['type'] ?? null) === 'fill_blank'
                    ? ($config['accepted_answers'] ?? [])
                    : [];

                // Normalize all correct answers and check if student answer matches any
                $normalizedCorrectAnswers = array_map(
                    fn ($ans) => strtolower(trim((string) $ans)),
                    array_filter($correctAnswers, fn ($ans) => $ans !== null && $ans !== '')
                );

                if (in_array($normalizedAnswer, $normalizedCorrectAnswers, true)) {
                    $score += (int) $question->points;
                }
            }
        }

        return [
            'score' => $score,
            'is_graded' => ! $hasUngradedEssay,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function formatPowerup(Powerup $powerup, ?int $limit = null): array
    {
        return [
            'id' => $powerup->id,
            'name' => $powerup->name,
            'slug' => $powerup->slug,
            'description' => $powerup->description,
            'icon' => $powerup->icon,
            'default_limit' => $powerup->default_limit,
            'config' => $powerup->config,
            'limit' => $limit,
        ];
    }

    /**
     * Show quiz builder for tutors.
     */
    public function edit(Course $course, Assessment $assessment): Response
    {
        $user = auth()->user();

        if (! $user?->hasRole('admin') && $course->instructor_id !== $user?->id) {
            abort(403);
        }

        $assessment->load(['questions', 'powerups']);
        $lessons = Lesson::query()
            ->where('course_id', $course->id)
            ->orderBy('order')
            ->get(['id', 'title', 'order']);
        $availablePowerups = Powerup::query()
            ->orderBy('name')
            ->get();

        $assessmentPowerups = $assessment->allowsPowerups()
            ? $assessment->powerups->map(function (Powerup $powerup) {
                return $this->formatPowerup($powerup, $powerup->pivot?->limit);
            })
            : collect();

        return Inertia::render('courses/quiz/edit', [
            'course' => $course,
            'lessons' => $lessons->map(fn (Lesson $lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'order' => $lesson->order,
            ]),
            'assessment' => [
                ...$assessment->toArray(),
                'powerups' => $assessmentPowerups,
            ],
            'availablePowerups' => $availablePowerups->map(function (Powerup $powerup) {
                return $this->formatPowerup($powerup);
            }),
        ]);
    }

    /**
     * Store a new assessment/quiz.
     */
    public function store(StoreQuizRequest $request, Course $course): RedirectResponse
    {
        $validated = $request->validated();
        $powerups = collect($validated['powerups'] ?? []);
        $type = $validated['type'];
        $maxScore = in_array($type, ['practice', 'quiz'], true)
            ? 100
            : ($validated['max_score'] ?? 100);
        $weightPercentage = $type === 'final_exam'
            ? ($validated['weight_percentage'] ?? null)
            : null;

        $assessment = $course->assessments()->create([
            ...$validated,
            'type' => $type,
            'max_score' => $maxScore,
            'allow_retakes' => $validated['allow_retakes'] ?? false,
            'is_published' => $validated['is_published'] ?? false,
            'weight_percentage' => $weightPercentage,
        ]);

        if ($assessment->allowsPowerups() && $powerups->isNotEmpty()) {
            $assessment->powerups()->sync(
                $powerups->mapWithKeys(fn (array $powerup) => [
                    $powerup['id'] => ['limit' => $powerup['limit']],
                ])->all()
            );
        }

        return redirect()->route('quiz.edit', [$course, $assessment])
            ->with('message', 'Quiz created successfully.');
    }

    /**
     * Update assessment/quiz settings.
     */
    public function update(UpdateQuizRequest $request, Course $course, Assessment $assessment): RedirectResponse
    {
        $validated = $request->validated();
        $powerups = collect($validated['powerups'] ?? []);
        $type = $validated['type'];
        $maxScore = in_array($type, ['practice', 'quiz'], true)
            ? 100
            : ($validated['max_score'] ?? $assessment->max_score);
        $weightPercentage = $type === 'final_exam'
            ? ($validated['weight_percentage'] ?? $assessment->weight_percentage)
            : null;

        $assessment->update([
            ...$validated,
            'type' => $type,
            'max_score' => $maxScore,
            'allow_retakes' => $validated['allow_retakes'] ?? false,
            'is_published' => $validated['is_published'] ?? false,
            'weight_percentage' => $weightPercentage,
        ]);

        if (! $assessment->allowsPowerups()) {
            $assessment->powerups()->detach();
        } elseif (array_key_exists('powerups', $validated)) {
            $assessment->powerups()->sync(
                $powerups->mapWithKeys(fn (array $powerup) => [
                    $powerup['id'] => ['limit' => $powerup['limit']],
                ])->all()
            );
        }

        return back()->with('message', 'Quiz updated successfully.');
    }

    /**
     * Store a new question.
     */
    public function storeQuestion(StoreAssessmentQuestionRequest $request, Course $course, Assessment $assessment): RedirectResponse
    {
        $user = auth()->user();

        if (! $user?->hasRole('admin') && $course->instructor_id !== $user?->id) {
            abort(403);
        }

        $validated = $request->validated();

        $maxOrder = $assessment->questions()->max('order') ?? 0;

        $assessment->questions()->create([
            ...$validated,
            'order' => $maxOrder + 1,
        ]);

        $this->recalculateMaxScore($assessment);

        return back()->with('message', 'Question added successfully.');
    }

    /**
     * Update a question.
     */
    public function updateQuestion(UpdateAssessmentQuestionRequest $request, Course $course, Assessment $assessment, AssessmentQuestion $question): RedirectResponse
    {
        $user = auth()->user();

        if (! $user?->hasRole('admin') && $course->instructor_id !== $user?->id) {
            abort(403);
        }

        $validated = $request->validated();

        $question->update($validated);

        $this->recalculateMaxScore($assessment);

        return back()->with('message', 'Question updated successfully.');
    }

    /**
     * Delete a question.
     */
    public function destroyQuestion(Course $course, Assessment $assessment, AssessmentQuestion $question): RedirectResponse
    {
        $user = auth()->user();

        if (! $user?->hasRole('admin') && $course->instructor_id !== $user?->id) {
            abort(403);
        }

        $question->delete();

        $this->recalculateMaxScore($assessment);

        return back()->with('message', 'Question deleted successfully.');
    }

    /**
     * Reorder questions.
     */
    public function reorderQuestions(Request $request, Course $course, Assessment $assessment): RedirectResponse
    {
        $user = auth()->user();

        if (! $user?->hasRole('admin') && $course->instructor_id !== $user?->id) {
            abort(403);
        }

        $validated = $request->validate([
            'questions' => 'required|array',
            'questions.*.id' => 'required|exists:assessment_questions,id',
            'questions.*.order' => 'required|integer|min:0',
        ]);

        foreach ($validated['questions'] as $questionData) {
            AssessmentQuestion::where('id', $questionData['id'])
                ->where('assessment_id', $assessment->id)
                ->update(['order' => $questionData['order']]);
        }

        return back()->with('message', 'Questions reordered successfully.');
    }

    /**
     * Show quiz to student for taking.
     */
    public function show(Course $course, Assessment $assessment): Response
    {
        $user = auth()->user();

        if (! $user) {
            abort(401);
        }

        $isEnrolled = $user->enrollments()->where('course_id', $course->id)->exists();
        $isTutor = $user->hasRole('admin') || $course->instructor_id === $user->id;

        if (! $isTutor && ! $isEnrolled) {
            abort(403);
        }

        if (! $assessment->is_published && ! $isTutor) {
            abort(403, 'This quiz is not available yet.');
        }

        $assessment->load('questions');

        $existingAttempt = $assessment->getLatestAttemptForUser($user->id);
        $bestAttempt = $assessment->getBestAttemptForUser($user->id);
        $canAttempt = $assessment->canUserAttempt($user->id);
        $finalScore = null;
        $canStartRemedial = false;
        $shouldHideScores = false;

        if ($existingAttempt && ! $existingAttempt->completed_at && ! $existingAttempt->isExpired()) {
            $existingAttempt->remaining_time = $existingAttempt->remaining_time;
        }

        if (! $isTutor) {
            $finalScore = FinalScore::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();
        }

        $shouldHideScores = $assessment->shouldHideScores()
            && ! $isTutor
            && (! $bestAttempt?->is_graded);

        if ($assessment->isFinalExam() && ! $isTutor && $finalScore) {
            $hasRemedialAttempt = AssessmentAttempt::query()
                ->where('assessment_id', $assessment->id)
                ->where('user_id', $user->id)
                ->where('is_remedial', true)
                ->exists();

            $canStartRemedial = $finalScore->total_score < 65 && ! $hasRemedialAttempt;
        }

        return Inertia::render('courses/quiz/show', [
            'course' => $course,
            'assessment' => $assessment,
            'existingAttempt' => $existingAttempt,
            'bestAttempt' => $bestAttempt,
            'canAttempt' => $canAttempt,
            'isTutor' => $isTutor,
            'finalScore' => $finalScore,
            'canStartRemedial' => $canStartRemedial,
            'shouldHideScores' => $shouldHideScores,
        ]);
    }

    /**
     * Start a new quiz attempt.
     */
    public function startAttempt(Course $course, Assessment $assessment): RedirectResponse
    {
        $user = auth()->user();

        if (! $user) {
            abort(401);
        }

        $isEnrolled = $user->enrollments()->where('course_id', $course->id)->exists();

        if (! $isEnrolled) {
            abort(403);
        }

        if (! $assessment->is_published) {
            abort(403, 'This quiz is not available yet.');
        }

        if (! $assessment->canUserAttempt($user->id)) {
            return back()->withErrors(['error' => 'You cannot start a new attempt for this quiz.']);
        }

        $existingAttempt = $assessment->getLatestAttemptForUser($user->id);

        if ($existingAttempt && ! $existingAttempt->completed_at && ! $existingAttempt->isExpired()) {
            return redirect()->route('quiz.take', [$course, $assessment]);
        }

        AssessmentAttempt::create([
            'assessment_id' => $assessment->id,
            'user_id' => $user->id,
            'started_at' => now(),
            'total_points' => $assessment->questions()->sum('points'),
        ]);

        return redirect()->route('quiz.take', [$course, $assessment]);
    }

    /**
     * Start a remedial attempt for a final exam.
     */
    public function startRemedialAttempt(Course $course, Assessment $assessment): RedirectResponse
    {
        $user = auth()->user();

        if (! $user) {
            abort(401);
        }

        if (! $assessment->isFinalExam()) {
            abort(404);
        }

        $isEnrolled = $user->enrollments()->where('course_id', $course->id)->exists();

        if (! $isEnrolled) {
            abort(403);
        }

        if (! $assessment->is_published) {
            abort(403, 'This exam is not available yet.');
        }

        $finalScore = FinalScore::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if (! $finalScore || $finalScore->total_score >= 65) {
            return back()->withErrors(['error' => 'You are not eligible for a remedial attempt.']);
        }

        $existingRemedial = AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('user_id', $user->id)
            ->where('is_remedial', true)
            ->latest()
            ->first();

        if ($existingRemedial && ! $existingRemedial->completed_at && ! $existingRemedial->isExpired()) {
            return redirect()->route('quiz.take', [$course, $assessment]);
        }

        if ($existingRemedial && $existingRemedial->completed_at) {
            return back()->withErrors(['error' => 'You have already completed a remedial attempt.']);
        }

        AssessmentAttempt::create([
            'assessment_id' => $assessment->id,
            'user_id' => $user->id,
            'started_at' => now(),
            'total_points' => $assessment->questions()->sum('points'),
            'is_remedial' => true,
        ]);

        return redirect()->route('quiz.take', [$course, $assessment]);
    }

    /**
     * Show the quiz taking interface.
     */
    public function take(Course $course, Assessment $assessment): Response|RedirectResponse
    {
        $user = auth()->user();

        if (! $user) {
            abort(401);
        }

        $attempt = $assessment->getLatestAttemptForUser($user->id);

        if (! $attempt || $attempt->completed_at) {
            return redirect()->route('quiz.show', [$course, $assessment]);
        }

        if ($attempt->isExpired()) {
            $this->autoSubmitAttempt($attempt);

            return redirect()->route('quiz.show', [$course, $assessment])
                ->with('message', 'Time expired. Your quiz has been automatically submitted.');
        }

        $assessment->load(['questions', 'powerups']);

        $questions = $assessment->questions->map(function ($question) {
            return [
                'id' => $question->id,
                'type' => $question->type,
                'question' => $question->question,
                'answer_config' => $question->answer_config,
                'points' => $question->points,
                'order' => $question->order,
            ];
        });

        $assessmentPowerups = $assessment->powerups->map(function (Powerup $powerup) {
            return $this->formatPowerup($powerup, $powerup->pivot?->limit);
        });

        $usedPowerups = $attempt->powerups()
            ->get()
            ->map(function (Powerup $powerup) {
                return [
                    'id' => $powerup->id,
                    'slug' => $powerup->slug,
                    'used_at' => $powerup->pivot?->used_at?->toISOString(),
                    'details' => $powerup->pivot?->details,
                ];
            })
            ->values();

        return Inertia::render('courses/quiz/take', [
            'course' => $course,
            'assessment' => [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'description' => $assessment->description,
                'type' => $assessment->type,
                'time_limit_minutes' => $assessment->time_limit_minutes,
                'max_score' => $assessment->max_score,
                'powerups' => $assessmentPowerups->values(),
            ],
            'questions' => $questions,
            'attempt' => [
                'id' => $attempt->id,
                'answers' => $attempt->answers ?? [],
                'started_at' => $attempt->started_at,
                'remaining_time' => $attempt->remaining_time,
                'is_remedial' => $attempt->is_remedial,
            ],
            'usedPowerups' => $usedPowerups,
        ]);
    }

    /**
     * Save progress (auto-save answers).
     */
    public function saveProgress(Request $request, Course $course, Assessment $assessment): RedirectResponse
    {
        $user = auth()->user();

        if (! $user) {
            abort(401);
        }

        $attempt = $assessment->getLatestAttemptForUser($user->id);

        if (! $attempt || $attempt->completed_at) {
            return back()->withErrors(['error' => 'No active attempt found.']);
        }

        if ($attempt->isExpired()) {
            $this->autoSubmitAttempt($attempt);

            return back()->withErrors(['error' => 'Time expired.']);
        }

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $attempt->update(['answers' => $validated['answers']]);

        return back();
    }

    /**
     * Submit the quiz attempt.
     */
    public function submit(Request $request, Course $course, Assessment $assessment): RedirectResponse
    {
        $user = auth()->user();

        if (! $user) {
            abort(401);
        }

        $attempt = $assessment->getLatestAttemptForUser($user->id);

        if (! $attempt || $attempt->completed_at) {
            return back()->withErrors(['error' => 'No active attempt found.']);
        }

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $attempt->update(['answers' => $validated['answers']]);
        $attempt->refresh();

        $this->gradeAttempt($attempt);

        return redirect()->route('quiz.show', [$course, $assessment])
            ->with('message', 'Quiz submitted successfully!');
    }

    /**
     * Use a powerup during a quiz attempt.
     */
    public function usePowerup(UseQuizPowerupRequest $request, Course $course, Assessment $assessment): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $attempt = $assessment->getLatestAttemptForUser($user->id);

        if (! $attempt || $attempt->completed_at) {
            return response()->json(['message' => 'No active attempt found.'], 422);
        }

        if ($attempt->isExpired()) {
            $this->autoSubmitAttempt($attempt);

            return response()->json(['message' => 'Time expired.'], 422);
        }

        $powerupId = (int) $request->input('powerup_id');
        $powerup = Powerup::query()->findOrFail($powerupId);

        $allowedPowerup = $assessment->powerups()
            ->where('powerup_id', $powerupId)
            ->first();

        if (! $allowedPowerup) {
            return response()->json(['message' => 'This powerup is not available for this quiz.'], 403);
        }

        $limit = (int) ($allowedPowerup->pivot?->limit ?? $powerup->default_limit ?? 1);
        $usedCount = $attempt->powerups()
            ->where('powerup_id', $powerupId)
            ->count();

        if ($usedCount >= $limit) {
            return response()->json(['message' => 'Powerup limit reached.'], 422);
        }

        $details = [];

        if ($powerup->slug === '50-50') {
            if (! $request->filled('question_id')) {
                return response()->json(['message' => 'Select a question to use this powerup.'], 422);
            }

            $questionId = (int) $request->input('question_id');
            $question = $assessment->questions()
                ->whereKey($questionId)
                ->first();

            $config = $question?->answer_config;
            $options = is_array($config) ? ($config['options'] ?? null) : null;

            if (! $question || $question->type !== 'multiple_choice' || ! is_array($options)) {
                return response()->json(['message' => 'This powerup can only be used on multiple choice questions.'], 422);
            }

            $correctIndex = is_array($config) ? ($config['correct_index'] ?? -1) : -1;
            $optionIndexes = array_keys($options);
            $wrongIndexes = array_values(array_filter($optionIndexes, function ($index) use ($correctIndex) {
                return $index !== $correctIndex;
            }));

            if ($correctIndex === -1 || count($wrongIndexes) === 0) {
                return response()->json(['message' => 'No incorrect options available to remove.'], 422);
            }

            $removeCount = (int) (data_get($powerup->config, 'remove_count', 2));
            $removeCount = max(1, min($removeCount, count($wrongIndexes)));

            $removedOptions = array_slice($wrongIndexes, 0, $removeCount);

            $details = [
                'question_id' => $question->id,
                'removed_options' => $removedOptions,
            ];
        }

        if ($powerup->slug === 'extra-time') {
            if (! $assessment->time_limit_minutes) {
                return response()->json(['message' => 'This quiz does not have a timer.'], 422);
            }

            $extraSeconds = (int) (data_get($powerup->config, 'extra_time_seconds', 0));

            if ($extraSeconds <= 0) {
                return response()->json(['message' => 'This powerup is not configured.'], 422);
            }

            $attempt->increment('time_extension', $extraSeconds);
            $details = [
                'added_seconds' => $extraSeconds,
            ];
        }

        if ($details === []) {
            return response()->json(['message' => 'Unsupported powerup.'], 422);
        }

        $attempt->powerups()->attach($powerupId, [
            'used_at' => now(),
            'details' => $details,
        ]);

        $attempt->refresh();

        return response()->json([
            'usage' => [
                'id' => $powerup->id,
                'slug' => $powerup->slug,
                'used_at' => now()->toISOString(),
                'details' => $details,
            ],
            'remaining_time' => $attempt->remaining_time,
            'used_count' => $usedCount + 1,
            'limit' => $limit,
        ]);
    }

    /**
     * Grade a quiz attempt.
     */
    protected function gradeAttempt(AssessmentAttempt $attempt): void
    {
        $assessment = $attempt->assessment;
        /** @var array<string, mixed> $answers */
        $answers = $attempt->answers ?? [];
        $calculated = $this->calculateAttemptScore($assessment, $answers);
        $isGraded = $assessment->isFinalExam() ? false : $calculated['is_graded'];

        $attempt->update([
            'score' => $calculated['score'],
            'completed_at' => now(),
            'is_graded' => $isGraded,
        ]);

        if ($isGraded) {
            $this->awardAssessmentPoints($attempt);
        }

        $this->syncSubmission($attempt);
    }

    /**
     * Auto-submit an expired attempt.
     */
    protected function autoSubmitAttempt(AssessmentAttempt $attempt): void
    {
        if ($attempt->completed_at) {
            return;
        }

        $this->gradeAttempt($attempt);
    }

    /**
     * Sync attempt score to assessment submission (for gradebook).
     */
    protected function syncSubmission(AssessmentAttempt $attempt): void
    {
        $assessment = $attempt->assessment;
        $userId = $attempt->user_id;

        if ($assessment->allow_retakes) {
            $bestAttempt = $assessment->getBestAttemptForUser($userId);
            $score = $bestAttempt?->score ?? $attempt->score;
        } else {
            $score = $attempt->score;
        }

        if ($assessment->isFinalExam() && ! $attempt->is_graded) {
            $score = null;
        }

        AssessmentSubmission::updateOrCreate(
            [
                'assessment_id' => $assessment->id,
                'user_id' => $userId,
            ],
            [
                'score' => $score,
                'submitted_at' => $attempt->completed_at ?? now(),
            ]
        );

        $this->syncFinalScore($assessment, $userId);
    }

    protected function awardAssessmentPoints(AssessmentAttempt $attempt): void
    {
        if ($attempt->points_awarded > 0 || $attempt->is_remedial) {
            return;
        }

        $user = $attempt->user;

        if (! $user || $attempt->score === null) {
            return;
        }

        $points = $this->gamificationService->awardAssessmentPoints(
            $user,
            $attempt->assessment->type,
            (int) $attempt->score,
            (int) $attempt->assessment->max_score,
            $attempt->is_remedial
        );

        $attempt->update([
            'points_awarded' => $points,
        ]);
    }

    protected function syncFinalScore(Assessment $assessment, int $userId): void
    {
        $course = $assessment->course;

        if (! $course) {
            return;
        }

        $assessments = $course->assessments()
            ->whereIn('type', ['quiz', 'final_exam'])
            ->get();

        if ($assessments->isEmpty()) {
            return;
        }

        $quizAssessments = $assessments->where('type', 'quiz');
        $finalExamAssessments = $assessments->where('type', 'final_exam');

        $quizPercent = $this->calculateAveragePercent($quizAssessments, $userId);
        $finalExamPercent = $this->calculateAveragePercent($finalExamAssessments, $userId);

        $quizScore = (int) round($quizPercent * 100);
        $finalExamScore = (int) round($finalExamPercent * 100);

        // New scoring logic based on final exam weight_percentage
        if ($finalExamAssessments->isNotEmpty()) {
            $finalExam = $finalExamAssessments->first();
            $finalExamWeight = ($finalExam->weight_percentage ?? 50) / 100; // Use custom weight or default to 50%
            $quizWeight = $quizAssessments->isNotEmpty() ? (1.0 - $finalExamWeight) : 0.0;
        } else {
            // No final exam: quizzes count for 100%
            $quizWeight = $quizAssessments->isNotEmpty() ? 1.0 : 0.0;
            $finalExamWeight = 0.0;
        }

        $totalPercent = ($quizPercent * $quizWeight) + ($finalExamPercent * $finalExamWeight);
        $totalScore = (int) round($totalPercent * 100);

        $hasRemedialAttempt = $finalExamAssessments->isNotEmpty()
            && AssessmentAttempt::query()
                ->whereIn('assessment_id', $finalExamAssessments->pluck('id'))
                ->where('user_id', $userId)
                ->where('is_remedial', true)
                ->whereNotNull('completed_at')
                ->exists();

        if ($hasRemedialAttempt) {
            $totalScore = min(65, $totalScore);
        }

        FinalScore::updateOrCreate(
            [
                'user_id' => $userId,
                'course_id' => $course->id,
            ],
            [
                'quiz_score' => $quizScore,
                'final_exam_score' => $finalExamScore,
                'total_score' => $totalScore,
                'is_remedial' => $hasRemedialAttempt,
            ]
        );
    }

    /**
     * @param  Collection<int, Assessment>  $assessments
     */
    protected function calculateAveragePercent(Collection $assessments, int $userId): float
    {
        if ($assessments->isEmpty()) {
            return 0.0;
        }

        $submissions = AssessmentSubmission::query()
            ->whereIn('assessment_id', $assessments->pluck('id'))
            ->where('user_id', $userId)
            ->get()
            ->keyBy('assessment_id');

        $percentTotal = 0.0;

        foreach ($assessments as $assessmentItem) {
            $submission = $submissions->get($assessmentItem->id);
            $score = (float) ($submission?->score ?? 0);
            $maxScore = max(1, (int) $assessmentItem->max_score);

            $percentTotal += $score / $maxScore;
        }

        return $percentTotal / $assessments->count();
    }

    /**
     * Recalculate max score based on questions.
     */
    protected function recalculateMaxScore(Assessment $assessment): void
    {
        $totalPoints = $assessment->questions()->sum('points');
        $assessment->update(['max_score' => max($totalPoints, 1)]);
    }

    /**
     * Grade essay questions (tutor only).
     */
    public function gradeEssay(Request $request, Course $course, Assessment $assessment, AssessmentAttempt $attempt): RedirectResponse
    {
        $user = auth()->user();

        if (! $user?->hasRole('admin') && $course->instructor_id !== $user?->id) {
            abort(403);
        }

        if ($assessment->course_id !== $course->id) {
            abort(404);
        }

        if ($attempt->assessment_id !== $assessment->id) {
            abort(404);
        }

        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.question_id' => 'required|exists:assessment_questions,id',
            'grades.*.points' => 'required|integer|min:0',
        ]);

        /** @var array<string, mixed> $answers */
        $answers = $attempt->answers ?? [];
        $questions = $assessment->questions()->get()->keyBy('id');

        foreach ($validated['grades'] as $grade) {
            $questionId = (int) $grade['question_id'];
            $question = $questions[$questionId] ?? null;

            if (! $question) {
                continue;
            }

            $maxPoints = (int) $question->points;
            $awardedPoints = min((int) $grade['points'], $maxPoints);
            $awardedPoints = max(0, $awardedPoints);

            $answers[$question->id.'_grade'] = $awardedPoints;
        }

        $calculated = $this->calculateAttemptScore($assessment, $answers);
        $isGraded = $calculated['is_graded'];

        $attempt->update([
            'answers' => $answers,
            'score' => $calculated['score'],
            'is_graded' => $isGraded,
            'completed_at' => $attempt->completed_at ?? now(),
        ]);

        if ($isGraded) {
            $this->awardAssessmentPoints($attempt);
        }

        $this->syncSubmission($attempt);

        return back()->with('message', 'Grades saved successfully.');
    }
}
