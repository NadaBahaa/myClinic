<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class SyncServiceMaterialsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'superadmin'], true);
    }

    public function rules(): array
    {
        return [
            'materials'                   => 'nullable|array',
            'materials.*.materialId'      => 'required|uuid|exists:materials_tools,uuid',
            'materials.*.defaultQuantity' => 'required|numeric|min:0.001|max:99999',
        ];
    }
}
