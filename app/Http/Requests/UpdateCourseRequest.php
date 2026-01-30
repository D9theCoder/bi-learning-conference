<?php

namespace App\Http\Requests;

use App\CourseCategory;
use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
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
            'instructor_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
