<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseContent extends Model
{
    /** @use HasFactory<\Database\Factories\CourseContentFactory> */
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'title',
        'type',
        'file_path',
        'url',
        'description',
        'due_date',
        'duration_minutes',
        'is_required',
        'order',
        // Assessment-specific fields
        'assessment_id',
        'assessment_type',
        'max_score',
        'allow_powerups',
        'allowed_powerups',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'order' => 'integer',
            'duration_minutes' => 'integer',
            'due_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            // Assessment-specific casts
            'max_score' => 'integer',
            'allow_powerups' => 'boolean',
            'allowed_powerups' => 'json',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }
}
