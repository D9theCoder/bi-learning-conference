<?php

namespace App\Http\Requests;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentMeetingScheduleRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'lesson_id' => $this->input('lesson_id') === '' ? null : $this->input('lesson_id'),
            'meeting_url' => $this->input('meeting_url') === '' ? null : $this->input('meeting_url'),
            'duration_minutes' => $this->input('duration_minutes') === '' ? null : $this->input('duration_minutes'),
            'notes' => $this->input('notes') === '' ? null : $this->input('notes'),
            'status' => $this->input('status') === '' ? null : $this->input('status'),
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
        /** @var Course|null $course */
        $course = $this->route('course');

        return [
            'student_id' => [
                'required',
                'integer',
                Rule::exists('enrollments', 'user_id')->when(
                    $course,
                    fn ($query) => $query->where('course_id', $course->id)
                ),
            ],
            'lesson_id' => [
                'required',
                'integer',
                Rule::exists('lessons', 'id')->when(
                    $course,
                    fn ($query) => $query->where('course_id', $course->id)
                ),
            ],
            'title' => ['nullable', 'string', 'max:255'],
            'meeting_url' => ['nullable', 'string', 'max:255'],
            'scheduled_at' => ['required', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:scheduled,completed,cancelled'],
        ];
    }
}
