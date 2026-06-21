<?php

namespace App\Policies;

use App\Models\Patient;
use App\Models\PatientFile;
use App\Models\User;
use App\Policies\Concerns\HandlesMedicalRoles;

class PatientFilePolicy
{
    use HandlesMedicalRoles;

    public function viewAny(User $user, Patient $patient): bool
    {
        if ($user->role === 'accountant') {
            return false;
        }

        if ($this->isAdmin($user) || $user->role === 'assistant') {
            return true;
        }

        if ($user->role === 'doctor') {
            return $this->doctorHasPatientAccess($user, $patient);
        }

        return false;
    }

    public function view(User $user, PatientFile $patientFile): bool
    {
        if ($user->role === 'accountant') {
            return false;
        }

        if ($this->isAdmin($user) || $user->role === 'assistant') {
            return true;
        }

        if ($user->role === 'doctor') {
            return $this->doctorOwnsPatientFile($user, $patientFile);
        }

        return false;
    }

    public function create(User $user, Patient $patient): bool
    {
        return $this->viewAny($user, $patient);
    }
}
