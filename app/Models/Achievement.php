<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Achievement extends Model
{
    /** @use HasFactory<\Database\Factories\AchievementFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'icon',
        'rarity',
        'criteria',
        'xp_reward',
        'category',
        'target',
    ];

    protected function casts(): array
    {
        return [
            'rarity' => 'string',
            'xp_reward' => 'integer',
            'target' => 'integer',
            'criteria' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withTimestamps()
            ->withPivot(['earned_at', 'progress']);
    }

    /**
     * Get parsed criteria as array.
     *
     * @return array{type: string, target: int}|null
     */
    public function parsedCriteria(): ?array
    {
        $criteria = $this->criteria;

        if (is_array($criteria) && isset($criteria['type'])) {
            return $criteria;
        }

        return null;
    }

    /**
     * Get human-readable criteria description.
     */
    public function criteriaDescription(): string
    {
        $criteria = $this->parsedCriteria();

        if ($criteria === null) {
            return $this->description;
        }

        $typeLabels = [
            'lessons_completed' => 'Complete %d lessons',
            'courses_completed' => 'Complete %d courses',
            'courses_enrolled' => 'Enroll in %d courses',
            'quizzes_completed' => 'Complete %d quizzes',
            'perfect_quiz' => 'Get %d perfect quiz scores',
            'streak_days' => 'Maintain a %d-day streak',
            'total_xp_earned' => 'Earn %d total XP',
            'level_reached' => 'Reach level %d',
            'tasks_completed' => 'Complete %d daily tasks',
            'daily_all_tasks' => 'Complete all daily tasks %d times',
            'first_lesson' => 'Complete your first lesson',
        ];

        $template = $typeLabels[$criteria['type']] ?? 'Complete %d activities';

        return sprintf($template, $this->target);
    }
}
