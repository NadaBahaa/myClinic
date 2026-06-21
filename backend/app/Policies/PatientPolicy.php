<?php

namespace App\Policies;

use App\Models\Patient;
use App\Models\User;
use App\Policies\Concerns\HandlesMedicalRoles;

class PatientPolicy
{
    use HandlesMedicalRoles;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true);
    }

    public function view(User $user, Patient $patient): bool
    {
        if ($this->isAdmin($user) || $user->role === 'assistant') {
            return true;
        }

        if ($user->role === 'doctor') {
            return $this->doctorHasPatientAccess($user, $patient);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true);
    }

    public function update(User $user, Patient $patient): bool
    {
        if ($this->isAdmin($user) || $user->role === 'assistant') {
            return true;
        }

        if ($user->role === 'doctor') {
            return $this->doctorHasPatientAccess($user, $patient);
        }

        return false;
    }

    public function delete(User $user, Patient $patient): bool
    {
        return $this->isAdmin($user);
    }
}
