<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assessment extends Model
{
    /** @use HasFactory<\Database\Factories\AssessmentFactory> */
    use HasFactory;

    protected $fillable = [
        'course_id',
        'lesson_id',
        'type',
        'title',
        'description',
        'due_date',
        'max_score',
        'allow_retakes',
        'time_limit_minutes',
        'is_published',
        'is_remedial',
        'weight_percentage',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
            'allow_retakes' => 'boolean',
            'is_published' => 'boolean',
            'is_remedial' => 'boolean',
            'weight_percentage' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssessmentSubmission::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(AssessmentQuestion::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(AssessmentAttempt::class);
    }

    public function powerups(): BelongsToMany
    {
        return $this->belongsToMany(Powerup::class)
            ->withPivot('limit');
    }

    public function getBestAttemptForUser(int $userId): ?AssessmentAttempt
    {
        return $this->attempts()
            ->where('user_id', $userId)
            ->whereNotNull('completed_at')
            ->orderByDesc('score')
            ->first();
    }

    public function getLatestAttemptForUser(int $userId): ?AssessmentAttempt
    {
        return $this->attempts()
            ->where('user_id', $userId)
            ->latest()
            ->first();
    }

    public function canUserAttempt(int $userId): bool
    {
        $latestAttempt = $this->getLatestAttemptForUser($userId);

        if (! $latestAttempt) {
            return true;
        }

        if (! $latestAttempt->completed_at && ! $latestAttempt->isExpired()) {
            return false;
        }

        if ($latestAttempt->completed_at && ! $this->allow_retakes) {
            return false;
        }

        return true;
    }

    public function allowsPowerups(): bool
    {
        return in_array($this->type, ['practice', 'quiz'], true);
    }

    public function shouldHideScores(): bool
    {
        return $this->isFinalExam();
    }

    public function isFinalExam(): bool
    {
        return $this->type === 'final_exam';
    }

    public function isPractice(): bool
    {
        return $this->type === 'practice';
    }
}
