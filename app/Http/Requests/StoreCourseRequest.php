<?php

namespace App\Http\Requests;

use App\CourseCategory;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'difficulty' => $this->input('difficulty') === '' ? null : $this->input('difficulty'),
            'duration_minutes' => $this->input('duration_minutes') === '' ? null : $this->input('duration_minutes'),
            'category' => $this->input('category') === '' ? null : $this->input('category'),
            'thumbnail' => $this->input('thumbnail') === '' ? null : $this->input('thumbnail'),
            'instructor_id' => $this->input('instructor_id') === '' ? null : $this->input('instructor_id'),
        ]);
    }

    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->hasRole('admin') ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'difficulty' => ['nullable', 'in:beginner,intermediate,advanced'],
            // !Locked STEM categories only.
            'category' => ['required', Rule::enum(CourseCategory::class)],
            'is_published' => ['sometimes', 'boolean'],
            'instructor_id' => [
                'required',
                'exists:users,id',
                function (string $attribute, mixed $value, $fail) {
                    $instructor = User::find($value);
                    if (! $instructor || ! $instructor->hasRole('tutor')) {
                        $fail('The selected instructor must have the tutor role.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'instructor_id.required' => 'As an admin, you must assign a tutor to this course.',
        ];
    }
}
