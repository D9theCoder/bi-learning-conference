<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ToggleTaskCompletionRequest extends FormRequest
{
    public function authorize(): bool
    {
        // User must own the task
        $task = $this->route('task');

        return $task && $task->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'completed' => ['required', 'boolean'],
        ];
    }
}
