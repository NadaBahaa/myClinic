<?php

namespace App\Http\Requests\Doctor;

use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin']);
    }

    public function rules(): array
    {
        return [
            'name'                => 'required|string|max:150',
            'email'               => 'required|email|max:191|unique:doctors,email',
            'phone'               => 'nullable|string|max:30',
            'specialty'           => 'required|string|max:100',
            'experience'          => 'required|integer|min:0|max:60',
            'qualifications'      => 'nullable|string|max:1000',
            'licenseNumber'       => 'nullable|string|max:80',
            'availability'        => 'nullable|array',
            'availability.*'      => 'string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'practitionerTypeId'  => 'nullable|exists:practitioner_types,uuid',
            'userId'              => 'nullable|exists:users,uuid',
        ];
    }
}
