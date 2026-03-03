<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user || ! in_array($user->role, ['admin', 'superadmin'], true)) {
            return false;
        }
        // Only superadmin can create another superadmin
        if (($this->input('role')) === 'superadmin' && $user->role !== 'superadmin') {
            return false;
        }
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                       => 'required|string|max:150',
            'email'                      => 'required|email|max:191|unique:users,email',
            'password'                   => ['required', Password::min(6)->max(128)],
            'role'                       => 'required|in:superadmin,admin,doctor,assistant,accountant',
            'practitionerTypeId'         => 'nullable|exists:practitioner_types,uuid',
            'permissions'                    => 'required|array',
            'permissions.showCalendar'       => 'boolean',
            'permissions.showPatients'       => 'boolean',
            'permissions.showDoctors'        => 'boolean',
            'permissions.showServices'       => 'boolean',
            'permissions.showUsers'          => 'boolean',
            'permissions.showSettings'       => 'boolean',
            'permissions.showActivityLog'    => 'boolean',
            'permissions.showReports'        => 'boolean',
            'permissions.showMaterialsTools' => 'boolean',
            'permissions.showPractitionerTypes' => 'boolean',
        ];
    }
}
