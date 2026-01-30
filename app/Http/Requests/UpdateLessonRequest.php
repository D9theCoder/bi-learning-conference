<?php

namespace App\Http\Requests;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'duration_minutes' => $this->input('duration_minutes') === '' ? null : $this->input('duration_minutes'),
            'order' => $this->input('order') === '' ? null : $this->input('order'),
            'video_url' => $this->input('video_url') === '' ? null : $this->input('video_url'),
            'description' => $this->input('description') === '' ? null : $this->input('description'),
        ]);
    }

    public function authorize(): bool
    {
        $user = $this->user();
        /** @var Course|null $course */
        $course = $this->route('course');
        /** @var Lesson|null $lesson */
        $lesson = $this->route('lesson');

        if (! $user || ! $course || ! $lesson || $lesson->course_id !== $course->id) {
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
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'order' => ['nullable', 'integer', 'min:1'],
            'video_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}
