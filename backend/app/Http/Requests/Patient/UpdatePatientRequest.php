<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user(); }

    public function rules(): array
    {
        return [
            'name'             => 'sometimes|string|max:150',
            'phone'            => 'sometimes|string|max:30',
            'email'            => 'nullable|email|max:191',
            'dateOfBirth'      => 'nullable|date|before:today',
            'address'          => 'nullable|string|max:255',
            'emergencyContact' => 'nullable|string|max:255',
            'notes'            => 'nullable|string|max:2000',
            'lastVisit'        => 'nullable|date',
            'totalVisits'      => 'sometimes|integer|min:0',
        ];
    }
}
