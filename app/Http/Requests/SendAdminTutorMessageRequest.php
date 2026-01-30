<?php

namespace App\Http\Requests;

use App\Models\Course;
use App\Models\TutorMessage;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendAdminTutorMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        if (! $this->isTutorUser($user)) {
            return false;
        }

        $adminId = $this->input('admin_id');

        if (! $adminId || ! is_numeric($adminId)) {
            return false;
        }

        $admin = User::find((int) $adminId);

        if (! $admin || ! $admin->hasRole('admin')) {
            return false;
        }

        return TutorMessage::query()
            ->where('tutor_id', $user->id)
            ->where('user_id', $admin->id)
            ->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $isAdmin = $user?->hasRole('admin') ?? false;
        $isTutor = $user ? $this->isTutorUser($user) : false;

        return [
            'tutor_id' => [
                Rule::requiredIf($isAdmin),
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'admin_id' => [
                Rule::requiredIf($isTutor && ! $isAdmin),
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'content' => ['required', 'string', 'min:1', 'max:2000'],
        ];
    }

    private function isTutorUser(User $user): bool
    {
        if ($user->hasRole('tutor')) {
            return true;
        }

        return Course::where('instructor_id', $user->id)->exists();
    }
}
