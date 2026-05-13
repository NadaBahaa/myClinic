<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->role === 'admin'; }

    public function rules(): array
    {
        return [
            'name'                        => 'required|string|max:150',
            'category'                    => 'required|string|max:80',
            'duration'                    => 'required|integer|min:5|max:480',
            'price'                       => 'required|numeric|min:0|max:99999',
            'description'                 => 'required|string|max:1000',
            'popular'                     => 'boolean',
            'allowedPractitionerTypeIds'  => 'nullable|array',
            'allowedPractitionerTypeIds.*' => 'exists:practitioner_types,uuid',
            'defaultMaterials'            => 'sometimes|array',
            'defaultMaterials.*.materialId' => 'required|string|exists:materials_tools,uuid',
            'defaultMaterials.*.defaultQuantity' => 'required|numeric|min:0.001|max:99999',
        ];
    }
}
