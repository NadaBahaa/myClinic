<?php

namespace App\Http\Requests\Doctor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin']);
    }

    public function rules(): array
    {
        return [
            'name'                => 'sometimes|string|max:150',
            'email'               => 'sometimes|email|max:191',
            'phone'               => 'nullable|string|max:30',
            'specialty'           => 'sometimes|string|max:100',
            'experience'          => 'sometimes|integer|min:0|max:60',
            'qualifications'      => 'nullable|string|max:1000',
            'licenseNumber'       => 'nullable|string|max:80',
            'availability'        => 'nullable|array',
            'availability.*'      => 'string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'practitionerTypeId'  => 'nullable|exists:practitioner_types,uuid',
        ];
    }
}
