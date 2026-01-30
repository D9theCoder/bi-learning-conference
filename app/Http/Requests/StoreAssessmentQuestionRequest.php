<?php

namespace App\Http\Requests;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAssessmentQuestionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $type = $this->input('type');
        $options = $this->input('options');
        $normalizedOptions = is_array($options) ? $options : [];
        $correctAnswer = $this->input('correct_answer');

        $answerConfig = match ($type) {
            'multiple_choice' => [
                'type' => 'multiple_choice',
                'options' => $normalizedOptions,
                'correct_index' => is_numeric($correctAnswer) ? (int) $correctAnswer : -1,
            ],
            'fill_blank' => [
                'type' => 'fill_blank',
                'accepted_answers' => $this->buildAcceptedAnswers(
                    is_string($correctAnswer) ? $correctAnswer : null,
                    $normalizedOptions
                ),
            ],
            'essay' => [
                'type' => 'essay',
            ],
            default => null,
        };

        if ($answerConfig !== null) {
            $this->merge(['answer_config' => $answerConfig]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        /** @var Course|null $course */
        $course = $this->route('course');

        if (! $user || ! $course) {
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
        $type = $this->input('type');

        return [
            'type' => 'required|in:multiple_choice,fill_blank,essay',
            'question' => 'required|string',
            'options' => match ($type) {
                'fill_blank' => 'nullable|array|max:20',
                'essay' => 'nullable|array',
                default => 'required|array|min:2|max:4',
            },
            'options.*' => 'nullable|string',
            'correct_answer' => $type === 'multiple_choice' ? 'required|string' : 'nullable|string',
            'points' => 'required|integer|min:1',
            'answer_config' => 'required|array',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $type = $this->input('type');
            $options = $this->input('options', []);
            $correctAnswer = $this->input('correct_answer');

            if ($type === 'multiple_choice') {
                $optionCount = is_array($options)
                    ? count(array_filter($options, fn ($option) => $option !== null && $option !== ''))
                    : 0;

                if ($optionCount < 2) {
                    $validator->errors()->add('options', 'Provide at least two answer options.');
                }

                if (! is_numeric($correctAnswer)) {
                    $validator->errors()->add('correct_answer', 'Select the correct answer.');

                    return;
                }

                $index = (int) $correctAnswer;

                if (! is_array($options) || $index < 0 || $index >= count($options)) {
                    $validator->errors()->add('correct_answer', 'The correct answer must match one of the options.');
                }
            }

            if ($type === 'fill_blank') {
                $hasOption = is_array($options)
                    && count(array_filter($options, fn ($option) => $option !== null && $option !== '')) > 0;
                $hasCorrect = is_string($correctAnswer) && trim($correctAnswer) !== '';

                if (! $hasOption && ! $hasCorrect) {
                    $validator->errors()->add('options', 'Provide at least one accepted answer.');
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'question.required' => 'Please provide a question.',
            'points.required' => 'Points are required.',
            'points.min' => 'Points must be at least 1.',
        ];
    }

    /**
     * @param  array<int, mixed>  $options
     * @return array<int, string>
     */
    protected function buildAcceptedAnswers(?string $primary, array $options): array
    {
        $candidates = [];

        if ($primary !== null && $primary !== '') {
            $candidates[] = $primary;
        }

        foreach ($options as $option) {
            if (! is_string($option)) {
                continue;
            }

            if ($option === '') {
                continue;
            }

            $candidates[] = $option;
        }

        $seen = [];
        $unique = [];

        foreach ($candidates as $candidate) {
            $normalized = strtolower(trim($candidate));

            if ($normalized === '' || isset($seen[$normalized])) {
                continue;
            }

            $seen[$normalized] = true;
            $unique[] = $candidate;
        }

        return $unique;
    }
}
