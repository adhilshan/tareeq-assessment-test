<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTowingRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCustomer() ?? false;
    }

    public function rules(): array
    {
        return [
            'customer_name'          => ['required', 'string', 'max:255'],
            'location'               => ['required', 'array'],
            'location.lat'           => ['required', 'numeric', 'between:-90,90'],
            'location.lng'           => ['required', 'numeric', 'between:-180,180'],
            'location.address'       => ['nullable', 'string', 'max:500'],
            'note'                   => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required'  => 'Customer name is required.',
            'location.required'       => 'Pickup location is required.',
            'location.lat.required'   => 'Pickup latitude is required.',
            'location.lng.required'   => 'Pickup longitude is required.',
        ];
    }
}
