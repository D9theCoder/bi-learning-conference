<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RedeemRewardRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user || $this->route('reward') === null) {
            return false;
        }

        return $user->hasAnyRole(['student', 'admin']);
    }

    public function rules(): array
    {
        return [];
    }
}
