<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AssessmentAttempt extends Model
{
    /** @use HasFactory<\Database\Factories\AssessmentAttemptFactory> */
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'user_id',
        'answers',
        'score',
        'total_points',
        'started_at',
        'time_extension',
        'completed_at',
        'is_graded',
        'is_remedial',
        'points_awarded',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'is_graded' => 'boolean',
            'time_extension' => 'integer',
            'is_remedial' => 'boolean',
            'points_awarded' => 'integer',
        ];
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function powerups(): BelongsToMany
    {
        return $this->belongsToMany(Powerup::class, 'assessment_attempt_powerups')
            ->withPivot('used_at', 'details')
            ->using(AssessmentAttemptPowerup::class);
    }

    public function isExpired(): bool
    {
        if (! $this->assessment->time_limit_minutes || ! $this->started_at) {
            return false;
        }

        $endTime = $this->started_at->copy()
            ->addMinutes($this->assessment->time_limit_minutes)
            ->addSeconds(max(0, $this->time_extension ?? 0));

        return now()->greaterThan($endTime);
    }

    public function getRemainingTimeAttribute(): ?int
    {
        if (! $this->assessment->time_limit_minutes || ! $this->started_at) {
            return null;
        }

        $endTime = $this->started_at->copy()
            ->addMinutes($this->assessment->time_limit_minutes)
            ->addSeconds(max(0, $this->time_extension ?? 0));
        $remaining = now()->diffInSeconds($endTime, false);

        return max(0, $remaining);
    }
}
