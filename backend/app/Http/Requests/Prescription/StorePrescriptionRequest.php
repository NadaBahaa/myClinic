<?php

namespace App\Http\Requests\Prescription;

use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'doctor']);
    }

    public function rules(): array
    {
        return [
            'name'         => 'required|string|max:200',
            'dosage'       => 'nullable|string|max:100',
            'frequency'    => 'nullable|string|max:100',
            'duration'     => 'nullable|string|max:100',
            'prescribedBy' => 'required|string|max:150',
            'notes'        => 'nullable|string|max:1000',
        ];
    }
}
