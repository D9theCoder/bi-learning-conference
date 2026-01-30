<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'total_xp',
        'level',
        'points_balance',
        'current_streak',
        'longest_streak',
        'last_activity_date',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'total_xp' => 'integer',
            'level' => 'integer',
            'points_balance' => 'integer',
            'current_streak' => 'integer',
            'longest_streak' => 'integer',
            'last_activity_date' => 'date',
        ];
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function studentMeetingSchedules(): HasMany
    {
        return $this->hasMany(StudentMeetingSchedule::class, 'student_id');
    }

    public function activeEnrollments(): HasMany
    {
        return $this->enrollments()->where('status', 'active');
    }

    public function achievements(): BelongsToMany
    {
        return $this->belongsToMany(Achievement::class)
            ->withTimestamps()
            ->withPivot(['earned_at', 'progress']);
    }

    public function rewards(): BelongsToMany
    {
        return $this->belongsToMany(Reward::class)->withTimestamps()->withPivot('points_spent', 'claimed_at');
    }

    public function dailyTasks(): HasMany
    {
        return $this->hasMany(DailyTask::class);
    }

    public function tutorMessages(): HasMany
    {
        return $this->hasMany(TutorMessage::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(TutorMessage::class, 'tutor_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function assessmentSubmissions(): HasMany
    {
        return $this->hasMany(AssessmentSubmission::class);
    }

    /**
     * Determine if the user should see gamification features.
     */
    public function hasGamification(): bool
    {
        return ! $this->hasAnyRole(['admin', 'tutor']);
    }

    // Helper methods for dashboard statistics
    public function currentStreak(): int
    {
        return $this->current_streak ?? 0;
    }

    public function xpThisWeek(): int
    {
        $weekStart = now()->startOfWeek();

        return $this->activities()
            ->where('created_at', '>=', $weekStart)
            ->whereIn('type', ['task_completed', 'lesson_completed', 'achievement_earned', 'streak_milestone'])
            ->sum('xp_earned');
    }

    public function hoursThisWeek(): float
    {
        $weekStart = now()->startOfWeek();

        $minutes = $this->dailyTasks()
            ->where('is_completed', true)
            ->where('completed_at', '>=', $weekStart)
            ->sum('estimated_minutes');

        return round($minutes / 60, 1);
    }

    public function nextAchievementMilestone(): ?Achievement
    {
        $earnedIds = $this->achievements()->pluck('achievements.id');

        return Achievement::whereNotIn('id', $earnedIds)
            ->orderBy('xp_reward')
            ->first();
    }

    public function weeklyActivityChartData(): array
    {
        $data = [];
        $weekStart = now()->startOfWeek();

        for ($i = 0; $i < 7; $i++) {
            $date = $weekStart->copy()->addDays($i);
            $dayName = $date->format('D');

            $minutes = $this->dailyTasks()
                ->where('is_completed', true)
                ->whereDate('completed_at', $date)
                ->sum('estimated_minutes');

            $xp = $this->activities()
                ->whereIn('type', ['task_completed', 'lesson_completed', 'achievement_earned', 'streak_milestone'])
                ->whereDate('created_at', $date)
                ->sum('xp_earned');

            $data[] = [
                'day' => $dayName,
                'minutes' => $minutes,
                'xp' => $xp,
            ];
        }

        return $data;
    }

    public function nextLessonForEnrollment(Enrollment $enrollment): ?Lesson
    {
        return $enrollment->course->lessons()
            ->whereNotIn('id', function ($query) {
                $query->select('lesson_id')
                    ->from('daily_tasks')
                    ->where('user_id', $this->id)
                    ->where('is_completed', true);
            })
            ->orderBy('order')
            ->first();
    }
}
