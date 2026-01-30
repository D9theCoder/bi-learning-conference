<?php

namespace App\Http\Requests;

use App\Models\Assessment;
use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;

class UseQuizPowerupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        /** @var Course|null $course */
        $course = $this->route('course');
        /** @var Assessment|null $assessment */
        $assessment = $this->route('assessment');

        if (! $user || ! $course || ! $assessment) {
            return false;
        }

        if ($assessment->course_id !== $course->id) {
            return false;
        }

        if (! $assessment->is_published) {
            return false;
        }

        if (! $assessment->allowsPowerups()) {
            return false;
        }

        return $user->enrollments()->where('course_id', $course->id)->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'powerup_id' => ['required', 'integer', 'exists:powerups,id'],
            'question_id' => ['nullable', 'integer', 'exists:assessment_questions,id'],
        ];
    }
}
