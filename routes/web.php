<?php

use App\Http\Controllers\AchievementController;
use App\Http\Controllers\AdminTutorMessageController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CourseContentController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseManagementController;
use App\Http\Controllers\DailyTaskController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\RewardController;
use App\Http\Controllers\RewardRedemptionController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentMeetingScheduleController;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\UserManagementController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'userCount' => User::count(),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->middleware('role:student|tutor|admin')
        ->name('dashboard');

    // Achievement routes
    Route::get('achievements', [AchievementController::class, 'index'])
        ->middleware('role:student|admin')
        ->name('achievements');

    // Calendar routes
    Route::get('calendar', [CalendarController::class, 'index'])
        ->middleware('role:student|tutor|admin')
        ->name('calendar');
    Route::patch('tasks/{task}', [DailyTaskController::class, 'toggleComplete'])
        ->middleware('role:student|tutor|admin')
        ->name('tasks.toggle');

    // Debug: Generate daily tasks manually
    Route::post('tasks/generate', [DailyTaskController::class, 'generate'])
        ->middleware('role:student|tutor|admin')
        ->name('tasks.generate');
    Route::post('tasks/force-generate', [DailyTaskController::class, 'forceGenerate'])
        ->middleware('role:student|tutor|admin')
        ->name('tasks.force-generate');

    // Course routes
    Route::get('courses', [CourseController::class, 'index'])->name('courses');

    // Course management routes (admin/tutor)
    Route::middleware('role:admin|tutor')->prefix('courses/manage')->name('courses.manage.')->group(function () {
        Route::get('/', [CourseManagementController::class, 'index'])->name('index');
        Route::middleware('role:admin')->group(function () {
            Route::get('/create', [CourseManagementController::class, 'create'])->name('create');
            Route::post('/', [CourseManagementController::class, 'store'])->name('store');
        });
        Route::get('/{course}/edit', [CourseManagementController::class, 'edit'])->name('edit');
        Route::put('/{course}', [CourseManagementController::class, 'update'])->name('update');
        Route::post('/{course}/lessons', [CourseManagementController::class, 'storeLesson'])->name('lessons.store');
        Route::put('/{course}/lessons/{lesson}', [CourseManagementController::class, 'updateLesson'])->name('lessons.update');
        Route::delete('/{course}/lessons/{lesson}', [CourseManagementController::class, 'destroyLesson'])->name('lessons.destroy');
        Route::post('/{course}/lessons/{lesson}/contents', [CourseManagementController::class, 'storeContent'])->name('contents.store');
        Route::put('/{course}/lessons/{lesson}/contents/{content}', [CourseManagementController::class, 'updateContent'])->name('contents.update');
        Route::delete('/{course}/lessons/{lesson}/contents/{content}', [CourseManagementController::class, 'destroyContent'])->name('contents.destroy');
    });

    // Quiz management routes (admin/tutor)
    Route::middleware('role:admin|tutor')->prefix('courses/{course}/quiz')->name('quiz.')->group(function () {
        Route::post('/', [QuizController::class, 'store'])->name('store');
        Route::get('/{assessment}/edit', [QuizController::class, 'edit'])->name('edit');
        Route::put('/{assessment}', [QuizController::class, 'update'])->name('update');
        Route::post('/{assessment}/questions', [QuizController::class, 'storeQuestion'])->name('questions.store');
        Route::put('/{assessment}/questions/{question}', [QuizController::class, 'updateQuestion'])->name('questions.update');
        Route::delete('/{assessment}/questions/{question}', [QuizController::class, 'destroyQuestion'])->name('questions.destroy');
        Route::post('/{assessment}/questions/reorder', [QuizController::class, 'reorderQuestions'])->name('questions.reorder');
        Route::post('/{assessment}/attempts/{attempt}/grade-essay', [QuizController::class, 'gradeEssay'])->name('grade-essay');
    });

    // Quiz taking routes (students)
    Route::prefix('courses/{course}/quiz/{assessment}')->name('quiz.')->group(function () {
        Route::get('/', [QuizController::class, 'show'])->name('show');
        Route::post('/start', [QuizController::class, 'startAttempt'])->name('start');
        Route::post('/remedial', [QuizController::class, 'startRemedialAttempt'])->name('remedial');
        Route::get('/take', [QuizController::class, 'take'])->name('take');
        Route::post('/save', [QuizController::class, 'saveProgress'])->name('save');
        Route::post('/powerups/use', [QuizController::class, 'usePowerup'])->name('powerups.use');
        Route::post('/submit', [QuizController::class, 'submit'])->name('submit');
    });

    Route::get('courses/{course}', [CourseController::class, 'show'])
        ->whereNumber('course')
        ->name('courses.show');
    Route::get('courses/{course}/schedules', [StudentMeetingScheduleController::class, 'index'])
        ->middleware('role:student|tutor|admin')
        ->whereNumber('course')
        ->name('courses.schedules.index');
    Route::post('courses/{course}/schedules', [StudentMeetingScheduleController::class, 'store'])
        ->middleware('role:tutor|admin')
        ->whereNumber('course')
        ->name('courses.schedules.store');
    Route::put('courses/{course}/schedules/{schedule}', [StudentMeetingScheduleController::class, 'update'])
        ->middleware('role:tutor|admin')
        ->whereNumber('course')
        ->whereNumber('schedule')
        ->name('courses.schedules.update');
    Route::delete('courses/{course}/schedules/{schedule}', [StudentMeetingScheduleController::class, 'destroy'])
        ->middleware('role:tutor|admin')
        ->whereNumber('course')
        ->whereNumber('schedule')
        ->name('courses.schedules.destroy');
    Route::post('courses/{course}/enroll', [EnrollmentController::class, 'store'])
        ->middleware('role:student|admin')
        ->whereNumber('course')
        ->name('courses.enroll');
    Route::post('lessons/{lesson}/attend', [CourseController::class, 'markAttendance'])
        ->middleware('role:student|admin|tutor')
        ->whereNumber('lesson')
        ->name('lessons.attend');
    Route::post('contents/{content}/complete', [CourseContentController::class, 'markComplete'])
        ->whereNumber('content')
        ->name('contents.complete');
    Route::post('assessments/{assessment}/score', [CourseController::class, 'updateScore'])
        ->middleware('role:tutor|admin')
        ->name('assessments.score');

    // Message routes
    Route::get('messages', [MessageController::class, 'index'])->name('messages');
    Route::get('messages/poll', [MessageController::class, 'poll'])->name('messages.poll');
    Route::post('messages', [MessageController::class, 'store'])->name('messages.store');

    // Admin-Tutor messaging routes
    Route::get('admin-messages', [AdminTutorMessageController::class, 'index'])
        ->name('admin-messages');
    Route::get('admin-messages/poll', [AdminTutorMessageController::class, 'poll'])
        ->name('admin-messages.poll');
    Route::post('admin-messages', [AdminTutorMessageController::class, 'store'])
        ->name('admin-messages.store');

    // Reward routes
    Route::get('rewards', [RewardController::class, 'index'])
        ->middleware('role:student|admin')
        ->name('rewards');
    Route::post('rewards/{reward}/redeem', [RewardRedemptionController::class, 'store'])
        ->middleware('role:student|admin')
        ->name('rewards.redeem');

    // Tutor routes (for students)
    Route::get('tutors', [TutorController::class, 'index'])
        ->middleware('role:student|admin')
        ->name('tutors');

    // Student routes (for tutors)
    Route::get('students', [StudentController::class, 'index'])
        ->middleware('role:tutor|admin')
        ->name('students');

    // Admin user management routes
    Route::middleware('role:admin')->prefix('admin/users')->name('admin.users.')->group(function () {
        Route::get('/', [UserManagementController::class, 'index'])->name('index');
        Route::get('/create', [UserManagementController::class, 'create'])->name('create');
        Route::get('/{user}/edit', [UserManagementController::class, 'edit'])->name('edit');
        Route::post('/', [UserManagementController::class, 'store'])->name('store');
        Route::put('/{user}', [UserManagementController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserManagementController::class, 'destroy'])->name('destroy');
    });
});

require __DIR__.'/settings.php';
