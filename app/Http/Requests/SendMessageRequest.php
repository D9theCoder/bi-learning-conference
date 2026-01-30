<?php

namespace App\Http\Requests;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return false;
        }

        if ($user->hasAnyRole(['tutor', 'student'])) {
            return true;
        }

        // Allow instructors to reply even if the tutor role is missing
        return Course::where('instructor_id', $user->id)->exists();
    }

    public function rules(): array
    {
        return [
            'partner_id' => ['required', 'exists:users,id'],
            'content' => ['required', 'string', 'min:1', 'max:2000'],
        ];
    }
}
