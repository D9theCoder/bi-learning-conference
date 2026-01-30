<?php

namespace App\Models;

use App\Casts\AnswerConfigCast;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentQuestion extends Model
{
    /** @use HasFactory<\Database\Factories\AssessmentQuestionFactory> */
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'type',
        'question',
        'answer_config',
        'points',
        'order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'answer_config' => AnswerConfigCast::class,
        ];
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }
}
