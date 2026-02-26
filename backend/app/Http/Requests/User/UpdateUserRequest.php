<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'superadmin'], true);
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name'                       => 'sometimes|string|max:150',
            'email'                      => "sometimes|email|max:191|unique:users,email,{$userId},uuid",
            'password'                   => ['sometimes', Password::min(6)->max(128)],
            'role'                       => 'sometimes|in:superadmin,admin,doctor,assistant,accountant',
            'isActive'                     => 'sometimes|boolean',
            'practitionerTypeId'         => 'nullable|exists:practitioner_types,uuid',
            'permissions'                => 'sometimes|array',
            'permissions.showCalendar'   => 'boolean',
            'permissions.showPatients'   => 'boolean',
            'permissions.showDoctors'    => 'boolean',
            'permissions.showServices'   => 'boolean',
            'permissions.showUsers'      => 'boolean',
            'permissions.showSettings'   => 'boolean',
        ];
    }
}
