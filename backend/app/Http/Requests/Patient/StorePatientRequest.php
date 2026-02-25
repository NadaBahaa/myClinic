<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user(); }

    public function rules(): array
    {
        return [
            'name'             => 'required|string|max:150',
            'phone'            => 'required|string|max:30',
            'email'            => 'nullable|email|max:191',
            'dateOfBirth'      => 'nullable|date|before:today',
            'address'          => 'nullable|string|max:255',
            'emergencyContact' => 'nullable|string|max:255',
            'notes'            => 'nullable|string|max:2000',
        ];
    }
}
