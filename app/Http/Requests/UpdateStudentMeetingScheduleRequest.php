<?php

namespace App\Http\Requests;

use App\Models\Course;
use App\Models\StudentMeetingSchedule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentMeetingScheduleRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'lesson_id' => $this->input('lesson_id') === '' ? null : $this->input('lesson_id'),
            'meeting_url' => $this->input('meeting_url') === '' ? null : $this->input('meeting_url'),
            'duration_minutes' => $this->input('duration_minutes') === '' ? null : $this->input('duration_minutes'),
            'notes' => $this->input('notes') === '' ? null : $this->input('notes'),
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
        /** @var StudentMeetingSchedule|null $schedule */
        $schedule = $this->route('schedule');

        if (! $user || ! $course || ! $schedule || $schedule->course_id !== $course->id) {
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
            'lesson_id' => [
                'required',
                'integer',
                Rule::exists('lessons', 'id')->when(
                    $course,
                    fn ($query) => $query->where('course_id', $course->id)
                ),
            ],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'meeting_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'scheduled_at' => ['sometimes', 'required', 'date'],
            'duration_minutes' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', 'in:scheduled,completed,cancelled'],
        ];
    }
}
