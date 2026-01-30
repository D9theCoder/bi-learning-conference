<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseContentCompletion extends Model
{
    /** @use HasFactory<\Database\Factories\CourseContentCompletionFactory> */
    use HasFactory;

    protected $fillable = [
        'course_content_id',
        'user_id',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function courseContent(): BelongsTo
    {
        return $this->belongsTo(CourseContent::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

