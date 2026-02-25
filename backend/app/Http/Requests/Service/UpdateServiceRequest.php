<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->role === 'admin'; }

    public function rules(): array
    {
        return [
            'name'                        => 'sometimes|string|max:150',
            'category'                    => 'sometimes|string|max:80',
            'duration'                    => 'sometimes|integer|min:5|max:480',
            'price'                       => 'sometimes|numeric|min:0|max:99999',
            'description'                 => 'sometimes|string|max:1000',
            'popular'                     => 'boolean',
            'allowedPractitionerTypeIds'  => 'nullable|array',
            'allowedPractitionerTypeIds.*' => 'exists:practitioner_types,uuid',
        ];
    }
}
