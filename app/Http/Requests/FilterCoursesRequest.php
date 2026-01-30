<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FilterCoursesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:50'],
            'difficulty' => ['nullable', 'in:beginner,intermediate,advanced'],
            'sort' => ['nullable', 'in:popular,latest,progress'],
        ];
    }
}
