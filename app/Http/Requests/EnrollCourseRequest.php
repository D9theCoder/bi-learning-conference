<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnrollCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user || $this->route('course') === null) {
            return false;
        }

        return $user->hasAnyRole(['student', 'admin']);
    }

    public function rules(): array
    {
        return [];
    }
}
