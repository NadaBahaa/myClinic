<?php

namespace App\Http\Requests\MaterialOrTool;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialOrToolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'superadmin', 'doctor', 'assistant'], true);
    }

    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:150',
            'type'          => 'required|in:material,tool',
            'unitPrice'     => 'required|numeric|min:0',
            'unit'          => 'required|string|max:30',
            'stockQuantity' => 'nullable|integer|min:0',
            'supplier'      => 'nullable|string|max:150',
            'notes'         => 'nullable|string|max:500',
        ];
    }
}
