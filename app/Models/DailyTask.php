<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyTask extends Model
{
    /** @use HasFactory<\Database\Factories\DailyTaskFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'type',
        'lesson_id',
        'estimated_minutes',
        'xp_reward',
        'is_completed',
        'completed_at',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
            'due_date' => 'date',
            'xp_reward' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('due_date', today());
    }

    public function scopePending($query)
    {
        return $query->where('is_completed', false);
    }
}
