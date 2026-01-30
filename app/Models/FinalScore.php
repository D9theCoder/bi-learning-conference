<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinalScore extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'quiz_score',
        'final_exam_score',
        'total_score',
        'is_remedial',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quiz_score' => 'integer',
            'final_exam_score' => 'integer',
            'total_score' => 'integer',
            'is_remedial' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
