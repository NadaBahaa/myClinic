<?php

namespace App\Http\Requests\MaterialOrTool;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaterialOrToolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'superadmin', 'assistant', 'doctor'], true);
    }

    public function rules(): array
    {
        return [
            'name'          => 'sometimes|string|max:150',
            'type'          => 'sometimes|in:material,tool',
            'unitPrice'     => 'sometimes|numeric|min:0',
            'unit'          => 'sometimes|string|max:30',
            'stockQuantity' => 'nullable|integer|min:0',
            'supplier'      => 'nullable|string|max:150',
            'notes'         => 'nullable|string|max:500',
        ];
    }
}
