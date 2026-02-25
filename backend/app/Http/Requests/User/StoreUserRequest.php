<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name'                       => 'required|string|max:150',
            'email'                      => 'required|email|max:191|unique:users,email',
            'password'                   => ['required', Password::min(6)->max(128)],
            'role'                       => 'required|in:admin,doctor,assistant',
            'practitionerTypeId'         => 'nullable|exists:practitioner_types,uuid',
            'permissions'                => 'required|array',
            'permissions.showCalendar'   => 'boolean',
            'permissions.showPatients'   => 'boolean',
            'permissions.showDoctors'    => 'boolean',
            'permissions.showServices'   => 'boolean',
            'permissions.showUsers'      => 'boolean',
            'permissions.showSettings'   => 'boolean',
        ];
    }
}
