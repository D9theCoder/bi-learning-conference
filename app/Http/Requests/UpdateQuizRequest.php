<?php

namespace App\Http\Requests;

use App\Models\Assessment;
use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;

class UpdateQuizRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $type = $this->input('type');
        $maxScore = $this->input('max_score');
        $weightPercentage = $this->input('weight_percentage');

        $normalizedMaxScore = $maxScore === '' ? null : $maxScore;
        if (in_array($type, ['practice', 'quiz'], true)) {
            $normalizedMaxScore = 100;
        }

        $normalizedWeightPercentage = $weightPercentage === '' ? null : $weightPercentage;
        if ($type !== 'final_exam') {
            $normalizedWeightPercentage = null;
        }

        $this->merge([
            'lesson_id' => $this->input('lesson_id') === '' ? null : $this->input('lesson_id'),
            'due_date' => $this->input('due_date') === '' ? null : $this->input('due_date'),
            'time_limit_minutes' => $this->input('time_limit_minutes') === '' ? null : $this->input('time_limit_minutes'),
            'max_score' => $normalizedMaxScore,
            'weight_percentage' => $normalizedWeightPercentage,
        ]);
    }

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

        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('tutor') && $course->instructor_id === $user->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $course = $this->route('course');
        $currentAssessment = $this->route('assessment');

        return [
            'type' => [
                'required',
                'in:practice,quiz,final_exam',
                function ($attribute, $value, $fail) use ($course, $currentAssessment) {
                    if ($value === 'final_exam' && $course && $currentAssessment) {
                        // Check if changing TO final_exam and if another final exam already exists
                        if ($currentAssessment->type !== 'final_exam') {
                            $existingFinalExams = Assessment::where('course_id', $course->id)
                                ->where('type', 'final_exam')
                                ->count();

                            if ($existingFinalExams >= 1) {
                                $fail('A course can only have one final exam.');
                            }
                        }
                    }
                },
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'lesson_id' => ['nullable', 'exists:lessons,id'],
            'due_date' => ['nullable', 'date'],
            'max_score' => ['nullable', 'integer', 'min:1'],
            'allow_retakes' => ['sometimes', 'boolean'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:480'],
            'is_published' => ['sometimes', 'boolean'],
            'weight_percentage' => ['nullable', 'integer', 'min:51', 'max:100', 'required_if:type,final_exam'],
            'powerups' => ['nullable', 'array', 'prohibited_if:type,final_exam'],
            'powerups.*.id' => ['required', 'integer', 'exists:powerups,id'],
            'powerups.*.limit' => ['required', 'integer', 'min:1'],
        ];
    }
}
