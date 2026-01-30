<?php

use App\Models\Assessment;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\FinalScore;
use App\Models\Lesson;
use App\Models\Powerup;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->withoutMiddleware([
        ValidateCsrfToken::class,
        VerifyCsrfToken::class,
    ]);

    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach (['admin', 'tutor', 'student'] as $role) {
        Role::firstOrCreate(['name' => $role]);
    }
});

it('allows tutor to access quiz edit page', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $assessment = Assessment::factory()->for($course)->create();
    Lesson::factory()->for($course)->create(['order' => 1]);
    Lesson::factory()->for($course)->create(['order' => 2]);

    $response = $this->actingAs($tutor)->get("/courses/{$course->id}/quiz/{$assessment->id}/edit");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('courses/quiz/edit')
        ->has('assessment')
        ->has('course')
        ->has('lessons', 2)
        ->where('lessons.0.order', 1)
    );
});

it('prevents student from accessing quiz edit page', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    $assessment = Assessment::factory()->for($course)->create();

    $response = $this->actingAs($student)->get("/courses/{$course->id}/quiz/{$assessment->id}/edit");

    $response->assertForbidden();
});

it('sets max score to 100 for quiz assessments on creation', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz", [
        'type' => 'quiz',
        'title' => 'Intro Quiz',
        'description' => 'Quick knowledge check.',
    ]);

    $response->assertRedirect();
    $assessment = Assessment::where('course_id', $course->id)->first();

    expect($assessment)->not->toBeNull();
    expect($assessment?->max_score)->toBe(100);
    expect($assessment?->weight_percentage)->toBeNull();
});

it('requires weight percentage for final exam creation', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz", [
        'type' => 'final_exam',
        'title' => 'Final Exam',
        'description' => 'Comprehensive test.',
    ]);

    $response->assertSessionHasErrors('weight_percentage');
    $this->assertDatabaseMissing('assessments', [
        'course_id' => $course->id,
        'type' => 'final_exam',
        'title' => 'Final Exam',
    ]);
});

it('stores final exam weight percentage on creation', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);

    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz", [
        'type' => 'final_exam',
        'title' => 'Final Exam',
        'description' => 'Comprehensive test.',
        'weight_percentage' => 80,
    ]);

    $response->assertRedirect();
    $assessment = Assessment::where('course_id', $course->id)->first();

    expect($assessment)->not->toBeNull();
    expect($assessment?->weight_percentage)->toBe(80);
    expect($assessment?->max_score)->toBe(100);
});

it('allows tutor to add a multiple choice question', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $assessment = Assessment::factory()->for($course)->create();

    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$assessment->id}/questions", [
        'type' => 'multiple_choice',
        'question' => 'What is 2 + 2?',
        'options' => ['1', '2', '3', '4'],
        'correct_answer' => '3',
        'points' => 10,
    ]);

    $response->assertRedirect();
    expect(AssessmentQuestion::where('assessment_id', $assessment->id)->count())->toBe(1);
    $question = $assessment->questions()->first();
    expect($question)->toMatchArray([
        'type' => 'multiple_choice',
        'question' => 'What is 2 + 2?',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['1', '2', '3', '4'],
            'correct_index' => 3,
        ],
        'points' => 10,
    ]);
});

it('allows tutor to add a fill in the blank question', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $assessment = Assessment::factory()->for($course)->create();

    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$assessment->id}/questions", [
        'type' => 'fill_blank',
        'question' => 'The capital of France is ___.',
        'correct_answer' => 'Paris',
        'points' => 5,
    ]);

    $response->assertRedirect();
    $question = $assessment->questions()->first();
    expect($question)->toMatchArray([
        'type' => 'fill_blank',
        'question' => 'The capital of France is ___.',
        'answer_config' => [
            'type' => 'fill_blank',
            'accepted_answers' => ['Paris'],
        ],
    ]);
});

it('allows tutor to add an essay question', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $assessment = Assessment::factory()->for($course)->create();

    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$assessment->id}/questions", [
        'type' => 'essay',
        'question' => 'Explain the concept of photosynthesis.',
        'points' => 20,
    ]);

    $response->assertRedirect();
    $question = $assessment->questions()->first();
    expect($question)->toMatchArray([
        'type' => 'essay',
        'question' => 'Explain the concept of photosynthesis.',
        'points' => 20,
    ]);
});

it('allows tutor to update quiz settings', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $lesson = Lesson::factory()->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'allow_retakes' => false,
        'time_limit_minutes' => null,
        'is_published' => false,
    ]);

    $response = $this->actingAs($tutor)->put("/courses/{$course->id}/quiz/{$assessment->id}", [
        'type' => 'quiz',
        'title' => 'Updated Quiz Title',
        'description' => 'Updated description',
        'lesson_id' => $lesson->id,
        'max_score' => 100,
        'allow_retakes' => true,
        'time_limit_minutes' => 30,
        'is_published' => true,
    ]);

    $response->assertRedirect();
    $assessment->refresh();
    expect($assessment->title)->toBe('Updated Quiz Title');
    expect($assessment->allow_retakes)->toBeTrue();
    expect($assessment->time_limit_minutes)->toBe(30);
    expect($assessment->is_published)->toBeTrue();
    expect($assessment->lesson_id)->toBe($lesson->id);
});

it('allows student to view published quiz', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create(['is_published' => true]);
    $question = AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'fill_blank',
        'question' => 'The capital of France is ___.',
        'answer_config' => [
            'type' => 'fill_blank',
            'accepted_answers' => ['Paris'],
        ],
        'points' => 5,
    ]);
    $attempt = AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'answers' => [(string) $question->id => 'Paris'],
        'score' => 5,
        'completed_at' => now(),
        'is_graded' => true,
    ]);

    $response = $this->actingAs($student)->get("/courses/{$course->id}/quiz/{$assessment->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('courses/quiz/show')
        ->has('bestAttempt')
        ->has('existingAttempt')
        ->where('bestAttempt.id', $attempt->id)
        ->where('existingAttempt.id', $attempt->id)
        ->where('bestAttempt.answers', [(string) $question->id => 'Paris'])
    );
});

it('prevents unenrolled student from viewing quiz', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    $assessment = Assessment::factory()->for($course)->create(['is_published' => true]);

    $response = $this->actingAs($student)->get("/courses/{$course->id}/quiz/{$assessment->id}");

    $response->assertForbidden();
});

it('allows student to start a quiz attempt', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'is_published' => true,
        'allow_retakes' => true,
    ]);
    AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'multiple_choice',
        'question' => 'Test question',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
        ],
    ]);

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$assessment->id}/start");

    $response->assertRedirect();
    expect(AssessmentAttempt::where('user_id', $student->id)->where('assessment_id', $assessment->id)->count())->toBe(1);
});

it('prevents student from starting quiz when retakes not allowed and has completed attempt', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'is_published' => true,
        'allow_retakes' => false,
    ]);
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'completed_at' => now(),
    ]);

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$assessment->id}/start");

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');
});

it('renders quiz take screen with powerups for an active attempt', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'is_published' => true,
        'time_limit_minutes' => 15,
    ]);
    AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'multiple_choice',
        'question' => 'Test question',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
        ],
    ]);
    $attempt = AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'answers' => [],
    ]);
    $powerup = Powerup::query()->updateOrCreate(
        ['slug' => 'extra-time'],
        [
            'name' => 'Extra Time',
            'description' => 'Adds extra time to an assessment.',
            'icon' => 'power',
            'default_limit' => 1,
            'config' => ['extra_time_seconds' => 60],
        ]
    );
    $assessment->powerups()->attach($powerup->id, ['limit' => 2]);

    $response = $this->actingAs($student)->get("/courses/{$course->id}/quiz/{$assessment->id}/take");

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('courses/quiz/take')
        ->has('assessment.powerups', 1)
        ->has('questions', 1)
        ->where('attempt.id', $attempt->id)
        ->where('assessment.powerups.0.slug', 'extra-time')
    );
});

it('auto-grades multiple choice questions correctly', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create(['is_published' => true]);
    $question = AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'multiple_choice',
        'question' => 'What is 2 + 2?',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['1', '2', '3', '4'],
            'correct_index' => 3,
        ],
        'points' => 10,
    ]);
    $attempt = AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'answers' => [],
    ]);

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$assessment->id}/submit", [
        'answers' => [$question->id => '3'],
    ]);

    $response->assertRedirect();
    $attempt->refresh();
    expect($attempt->score)->toBe(10);
    expect($attempt->is_graded)->toBeTrue();
});

it('auto-grades fill in the blank questions case-insensitively', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create(['is_published' => true]);
    $question = AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'fill_blank',
        'question' => 'The capital of France is ___.',
        'answer_config' => [
            'type' => 'fill_blank',
            'accepted_answers' => ['Paris'],
        ],
        'points' => 5,
    ]);
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'answers' => [],
    ]);

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$assessment->id}/submit", [
        'answers' => [$question->id => 'paris'], // lowercase
    ]);

    $response->assertRedirect();
    $attempt = AssessmentAttempt::where('user_id', $student->id)->first();
    expect($attempt->score)->toBe(5);
});

it('auto-grades fill in the blank questions with optional answers', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create(['is_published' => true]);
    $question = AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'fill_blank',
        'question' => 'The capital of France is ___.',
        'answer_config' => [
            'type' => 'fill_blank',
            'accepted_answers' => ['Paris', 'paris', 'City of Paris'],
        ],
        'points' => 5,
    ]);
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'answers' => [],
    ]);

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$assessment->id}/submit", [
        'answers' => [$question->id => 'City of Paris'],
    ]);

    $response->assertRedirect();
    $attempt = AssessmentAttempt::where('user_id', $student->id)->first();
    expect($attempt->score)->toBe(5);
});

it('does not auto-grade essay questions', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create(['is_published' => true]);
    $question = AssessmentQuestion::factory()->for($assessment)->essay()->create([
        'question' => 'Explain photosynthesis.',
        'points' => 20,
    ]);
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'answers' => [],
    ]);

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$assessment->id}/submit", [
        'answers' => [$question->id => 'Plants use sunlight to make food.'],
    ]);

    $response->assertRedirect();
    $attempt = AssessmentAttempt::where('user_id', $student->id)->first();
    expect($attempt->is_graded)->toBeFalse(); // Essay needs manual grading
});

it('allows tutor to grade essay question', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $assessment = Assessment::factory()->for($course)->create();
    $question = AssessmentQuestion::factory()->for($assessment)->essay()->create([
        'question' => 'Explain photosynthesis.',
        'points' => 20,
    ]);
    $attempt = AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'completed_at' => now(),
        'answers' => [$question->id => 'Plants use sunlight to make food.'],
        'score' => 0,
        'total_points' => 20,
        'is_graded' => false,
    ]);

    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$assessment->id}/attempts/{$attempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $question->id,
                'points' => 15,
            ],
        ],
    ]);

    $response->assertRedirect();
    $attempt->refresh();
    expect($attempt->score)->toBe(15);
    expect($attempt->is_graded)->toBeTrue();

    // Idempotent: saving the same grade again should not add points twice.
    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$assessment->id}/attempts/{$attempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $question->id,
                'points' => 15,
            ],
        ],
    ]);

    $response->assertRedirect();
    $attempt->refresh();
    expect($attempt->score)->toBe(15);
});

it('allows tutor to manually grade objective questions per-question', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $student = User::factory()->create();
    $student->assignRole('student');

    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    $assessment = Assessment::factory()->for($course)->create();

    $question = AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'multiple_choice',
        'question' => 'What is 2 + 2?',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['1', '2', '3', '4'],
            'correct_index' => 3,
        ],
        'points' => 10,
    ]);

    $attempt = AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'completed_at' => now(),
        'answers' => [$question->id => '1'],
        'score' => 0,
        'total_points' => 10,
        'is_graded' => true,
    ]);

    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$assessment->id}/attempts/{$attempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $question->id,
                'points' => 7,
            ],
        ],
    ]);

    $response->assertRedirect();
    $attempt->refresh();

    expect($attempt->score)->toBe(7);
    expect($attempt->is_graded)->toBeTrue();

    // Overwrite (not add): update grade to 9, score should become 9.
    $response = $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$assessment->id}/attempts/{$attempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $question->id,
                'points' => 9,
            ],
        ],
    ]);

    $response->assertRedirect();
    $attempt->refresh();

    expect($attempt->score)->toBe(9);
});

it('keeps highest score when retakes are allowed', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'is_published' => true,
        'allow_retakes' => true,
    ]);
    $question = AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'multiple_choice',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
        ],
        'points' => 10,
    ]);

    // First attempt - wrong answer
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now()->subHour(),
        'completed_at' => now()->subHour(),
        'answers' => [$question->id => '1'],
        'score' => 0,
        'total_points' => 10,
        'is_graded' => true,
    ]);

    // Second attempt - correct answer
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'completed_at' => now(),
        'answers' => [$question->id => '0'],
        'score' => 10,
        'total_points' => 10,
        'is_graded' => true,
    ]);

    $bestAttempt = $assessment->getBestAttemptForUser($student->id);
    expect($bestAttempt->score)->toBe(10);
});

it('adds time extension when using an extra time powerup', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'is_published' => true,
        'time_limit_minutes' => 10,
    ]);
    $attempt = AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'time_extension' => 0,
    ]);

    $powerup = Powerup::query()->updateOrCreate(
        ['slug' => 'extra-time'],
        [
            'name' => 'Extra Time',
            'description' => 'Adds extra time to an assessment.',
            'icon' => 'power',
            'default_limit' => 1,
            'config' => ['extra_time_seconds' => 120],
        ]
    );
    $assessment->powerups()->attach($powerup->id, ['limit' => 2]);

    $response = $this->actingAs($student)->postJson(
        "/courses/{$course->id}/quiz/{$assessment->id}/powerups/use",
        ['powerup_id' => $powerup->id]
    );

    $response->assertSuccessful();
    $response->assertJsonPath('usage.slug', 'extra-time');

    $attempt->refresh();
    expect($attempt->time_extension)->toBe(120);
});

it('enforces powerup usage limits', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'is_published' => true,
        'time_limit_minutes' => 10,
    ]);
    $attempt = AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'time_extension' => 0,
    ]);

    $powerup = Powerup::query()->updateOrCreate(
        ['slug' => 'extra-time'],
        [
            'name' => 'Extra Time',
            'description' => 'Adds extra time to an assessment.',
            'icon' => 'power',
            'default_limit' => 1,
            'config' => ['extra_time_seconds' => 60],
        ]
    );
    $assessment->powerups()->attach($powerup->id, ['limit' => 1]);

    $this->actingAs($student)->postJson(
        "/courses/{$course->id}/quiz/{$assessment->id}/powerups/use",
        ['powerup_id' => $powerup->id]
    )->assertSuccessful();

    $this->actingAs($student)->postJson(
        "/courses/{$course->id}/quiz/{$assessment->id}/powerups/use",
        ['powerup_id' => $powerup->id]
    )->assertUnprocessable();

    $attempt->refresh();
    expect($attempt->time_extension)->toBe(60);
});

it('awards 150 points for completing practice assessment', function () {
    $student = User::factory()->create(['points_balance' => 0]);
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'type' => 'practice',
        'is_published' => true,
        'max_score' => 10,
    ]);
    $question = AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'multiple_choice',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
        ],
        'points' => 10,
    ]);
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'answers' => [],
    ]);

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$assessment->id}/submit", [
        'answers' => [$question->id => '0'],
    ]);

    $response->assertRedirect();
    $attempt = AssessmentAttempt::where('user_id', $student->id)
        ->where('assessment_id', $assessment->id)
        ->first();

    expect($attempt?->points_awarded)->toBe(150);
    $student->refresh();
    expect($student->points_balance)->toBe(150);
});

it('disallows powerups in final exams', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'type' => 'final_exam',
        'is_published' => true,
        'time_limit_minutes' => 10,
    ]);
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'time_extension' => 0,
    ]);
    $powerup = Powerup::query()->updateOrCreate(
        ['slug' => 'extra-time'],
        [
            'name' => 'Extra Time',
            'description' => 'Adds extra time to an assessment.',
            'icon' => 'power',
            'default_limit' => 1,
            'config' => ['extra_time_seconds' => 60],
        ]
    );
    $assessment->powerups()->attach($powerup->id, ['limit' => 1]);

    $response = $this->actingAs($student)->postJson(
        "/courses/{$course->id}/quiz/{$assessment->id}/powerups/use",
        ['powerup_id' => $powerup->id]
    );

    $response->assertForbidden();
});

it('hides final exam scores until reviewed', function () {
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create();
    Enrollment::factory()->for($student)->for($course)->create();
    $assessment = Assessment::factory()->for($course)->create([
        'type' => 'final_exam',
        'is_published' => true,
        'max_score' => 10,
    ]);
    $question = AssessmentQuestion::factory()->for($assessment)->create([
        'type' => 'multiple_choice',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
        ],
        'points' => 10,
    ]);
    AssessmentAttempt::factory()->for($student)->for($assessment)->create([
        'started_at' => now(),
        'answers' => [],
    ]);

    $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$assessment->id}/submit", [
        'answers' => [$question->id => '0'],
    ])->assertRedirect();

    $attempt = AssessmentAttempt::where('user_id', $student->id)->first();
    expect($attempt?->is_graded)->toBeFalse();

    $submission = AssessmentSubmission::where('assessment_id', $assessment->id)
        ->where('user_id', $student->id)
        ->first();

    expect($submission?->score)->toBeNull();
});

it('weights final exam using configured percentage', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    Enrollment::factory()->for($student)->for($course)->create();

    $quiz = Assessment::factory()->for($course)->create([
        'type' => 'quiz',
        'is_published' => true,
        'max_score' => 20,
    ]);
    $quizQuestionOne = AssessmentQuestion::factory()->for($quiz)->create([
        'type' => 'multiple_choice',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
        ],
        'points' => 10,
    ]);
    $quizQuestionTwo = AssessmentQuestion::factory()->for($quiz)->create([
        'type' => 'multiple_choice',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 1,
        ],
        'points' => 10,
    ]);
    AssessmentAttempt::factory()->for($student)->for($quiz)->create([
        'started_at' => now(),
        'answers' => [],
    ]);

    $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$quiz->id}/submit", [
        'answers' => [
            $quizQuestionOne->id => '0',
            $quizQuestionTwo->id => '2',
        ],
    ])->assertRedirect();

    $finalExam = Assessment::factory()->for($course)->create([
        'type' => 'final_exam',
        'is_published' => true,
        'max_score' => 20,
        'weight_percentage' => 80,
    ]);
    $finalExamQuestion = AssessmentQuestion::factory()->for($finalExam)->essay()->create([
        'points' => 20,
    ]);
    $finalAttempt = AssessmentAttempt::factory()->for($student)->for($finalExam)->create([
        'started_at' => now(),
        'answers' => [$finalExamQuestion->id => 'Answer'],
    ]);

    $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$finalExam->id}/attempts/{$finalAttempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $finalExamQuestion->id,
                'points' => 20,
            ],
        ],
    ])->assertRedirect();

    $finalScore = FinalScore::where('user_id', $student->id)
        ->where('course_id', $course->id)
        ->first();

    expect($finalScore?->quiz_score)->toBe(50);
    expect($finalScore?->final_exam_score)->toBe(100);
    expect($finalScore?->total_score)->toBe(90);
});

it('allows remedial attempt when final score is below 65', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    Enrollment::factory()->for($student)->for($course)->create();

    $finalExam = Assessment::factory()->for($course)->create([
        'type' => 'final_exam',
        'is_published' => true,
        'max_score' => 100,
        'weight_percentage' => 100,
    ]);
    $finalExamQuestion = AssessmentQuestion::factory()->for($finalExam)->essay()->create([
        'points' => 100,
    ]);
    $attempt = AssessmentAttempt::factory()->for($student)->for($finalExam)->create([
        'started_at' => now(),
        'answers' => [$finalExamQuestion->id => 'Answer'],
    ]);

    $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$finalExam->id}/attempts/{$attempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $finalExamQuestion->id,
                'points' => 60,
            ],
        ],
    ])->assertRedirect();

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$finalExam->id}/remedial");

    $response->assertRedirect();
    expect(AssessmentAttempt::where('assessment_id', $finalExam->id)->where('user_id', $student->id)->where('is_remedial', true)->exists())->toBeTrue();
});

it('prevents remedial attempt when final score is 65 or above', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $student = User::factory()->create();
    $student->assignRole('student');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    Enrollment::factory()->for($student)->for($course)->create();

    $finalExam = Assessment::factory()->for($course)->create([
        'type' => 'final_exam',
        'is_published' => true,
        'max_score' => 100,
        'weight_percentage' => 100,
    ]);
    $finalExamQuestion = AssessmentQuestion::factory()->for($finalExam)->essay()->create([
        'points' => 100,
    ]);
    $attempt = AssessmentAttempt::factory()->for($student)->for($finalExam)->create([
        'started_at' => now(),
        'answers' => [$finalExamQuestion->id => 'Answer'],
    ]);

    $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$finalExam->id}/attempts/{$attempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $finalExamQuestion->id,
                'points' => 70,
            ],
        ],
    ])->assertRedirect();

    $response = $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$finalExam->id}/remedial");

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');
});

it('caps final score at 65 and awards no points for remedial attempts', function () {
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $student = User::factory()->create(['points_balance' => 0]);
    $student->assignRole('student');
    $course = Course::factory()->create(['instructor_id' => $tutor->id]);
    Enrollment::factory()->for($student)->for($course)->create();

    $finalExam = Assessment::factory()->for($course)->create([
        'type' => 'final_exam',
        'is_published' => true,
        'max_score' => 100,
        'weight_percentage' => 100,
    ]);
    $finalExamQuestion = AssessmentQuestion::factory()->for($finalExam)->essay()->create([
        'points' => 100,
    ]);
    $initialAttempt = AssessmentAttempt::factory()->for($student)->for($finalExam)->create([
        'started_at' => now(),
        'answers' => [$finalExamQuestion->id => 'Answer'],
    ]);

    $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$finalExam->id}/attempts/{$initialAttempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $finalExamQuestion->id,
                'points' => 50,
            ],
        ],
    ])->assertRedirect();

    $student->refresh();
    $initialPoints = $student->points_balance;

    $this->actingAs($student)->post("/courses/{$course->id}/quiz/{$finalExam->id}/remedial")
        ->assertRedirect();

    $remedialAttempt = AssessmentAttempt::where('assessment_id', $finalExam->id)
        ->where('user_id', $student->id)
        ->where('is_remedial', true)
        ->first();

    $this->actingAs($tutor)->post("/courses/{$course->id}/quiz/{$finalExam->id}/attempts/{$remedialAttempt->id}/grade-essay", [
        'grades' => [
            [
                'question_id' => $finalExamQuestion->id,
                'points' => 100,
            ],
        ],
    ])->assertRedirect();

    $finalScore = FinalScore::where('user_id', $student->id)
        ->where('course_id', $course->id)
        ->first();

    $remedialAttempt->refresh();
    expect($finalScore?->total_score)->toBe(65);
    expect($remedialAttempt->points_awarded)->toBe(0);
    $student->refresh();
    expect($student->points_balance)->toBe($initialPoints);
});
